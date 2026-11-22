// Phone layout helper (≤ 639px): shortens bilingual labels and turns ordinary tables into
// stacked cards, so pages read like a standard phone app. Desktop is left untouched.
import { useEffect } from 'react';

const MQ = '(max-width: 639px)';
const MAX_CARD_COLUMNS = 14; // wide grids (31-day sheets, data grid) keep horizontal scroll

// "ព័ត៌មានទូទៅសាលា (School Profile)" → "ព័ត៌មានទូទៅសាលា" — only when Khmer text remains
const EN_PAREN = /\s*[(（][A-Za-z0-9][^()（）]*[)）]\s*/g;
const HAS_KHMER = /[ក-៿]/;
const SHORTEN_SELECTOR = 'h1, h2, h3, h4, button, label, th, [role="tab"], .mobile-short';

const originals = new WeakMap<Text, string>();

const shortenIn = (root: ParentNode) => {
  root.querySelectorAll(SHORTEN_SELECTOR).forEach((el) => {
    if ((el as HTMLElement).closest('[data-keep-text], .print-only')) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const t = n as Text;
      const v = t.nodeValue || '';
      if (!EN_PAREN.test(v)) continue;
      EN_PAREN.lastIndex = 0;
      const next = v.replace(EN_PAREN, ' ').replace(/\s{2,}/g, ' ').trimEnd();
      if (next !== v && HAS_KHMER.test(next)) {
        if (!originals.has(t)) originals.set(t, v);
        t.nodeValue = next;
      }
    }
  });
};

const labelTables = (root: ParentNode) => {
  root.querySelectorAll('table').forEach((table) => {
    const tbl = table as HTMLTableElement;
    if (tbl.closest('[data-no-cards], .print\\:block') || tbl.dataset.noCards !== undefined) return;
    const headRow = tbl.tHead?.rows[tbl.tHead.rows.length - 1];
    if (!headRow) return;
    const labels: string[] = [];
    Array.from(headRow.cells).forEach((c) => {
      const span = c.colSpan || 1;
      for (let i = 0; i < span; i++) labels.push((c.textContent || '').trim());
    });
    if (labels.length < 3 || labels.length > MAX_CARD_COLUMNS) return;
    tbl.classList.add('m-cards');
    Array.from(tbl.tBodies).forEach((tb) =>
      Array.from(tb.rows).forEach((row) => {
        let col = 0;
        Array.from(row.cells).forEach((cell) => {
          const label = labels[col] || '';
          if (cell.getAttribute('data-label') !== label) cell.setAttribute('data-label', label);
          col += cell.colSpan || 1;
        });
        if (row.cells.length === 1) row.classList.add('m-cards-full');
      })
    );
  });
};

const restoreText = () => {
  document.querySelectorAll('main ' + SHORTEN_SELECTOR.split(',').join(', main ')).forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const o = originals.get(n as Text);
      if (o !== undefined) (n as Text).nodeValue = o;
    }
  });
  document.querySelectorAll('table.m-cards').forEach((t) => t.classList.remove('m-cards'));
};

/** Run on the main content area; re-applies when React re-renders */
export const useMobileUi = (enabled = true) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(MQ);
    let obs: MutationObserver | null = null;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const main = document.querySelector('main');
        if (!main) return;
        obs?.disconnect();
        try {
          shortenIn(main);
          labelTables(main);
          // modals render outside <main>
          document.querySelectorAll('.fixed.inset-0').forEach((m) => shortenIn(m));
        } finally {
          obs?.observe(document.body, { childList: true, subtree: true, characterData: true });
        }
      });
    };
    const start = () => {
      document.documentElement.classList.add('is-phone');
      obs = new MutationObserver(run);
      obs.observe(document.body, { childList: true, subtree: true, characterData: true });
      run();
    };
    const stop = () => {
      obs?.disconnect();
      obs = null;
      document.documentElement.classList.remove('is-phone');
      restoreText();
    };
    const onChange = () => (mq.matches ? start() : stop());
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => {
      mq.removeEventListener?.('change', onChange);
      cancelAnimationFrame(raf);
      stop();
    };
  }, [enabled]);
};
