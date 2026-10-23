(() => {
  'use strict';
  class QuestionMapHistory {
    constructor() { this.entries = []; this.serial = 0; this.nodeIds = new WeakMap(); this.lastLive = []; }
    merge(live, direction = 1) {
      const entries = this.entries;
      const oldSignature = this.signature || '';
      const matches = new Array(live.length);
      const used = new Set();
      const accept = (i, record) => { if (record && !used.has(record)) { matches[i] = record; used.add(record); } };
      for (let i = 0; i < live.length; i++) {
        const item = live[i];
        if (item.key) accept(i, entries.find(e => e.key === item.key));
        const id = this.nodeIds.get(item.node);
        if (!matches[i] && id) accept(i, entries.find(e => e.id === id && (!item.key || !e.key || e.key === item.key)));
      }
      // A re-render at the same position may replace every DOM node, even repeated prompts.
      if (live.length === this.lastLive.length && live.every((item, i) => item.text === this.lastLive[i].text && Math.abs(item.position - this.lastLive[i].position) < 8)) {
        live.forEach((item, i) => { if (!matches[i]) accept(i, entries.find(e => e.id === this.lastLive[i].id && (!item.key || !e.key || item.key === e.key))); });
      }
      for (let i = 0; i < live.length; i++) {
        if (matches[i]) continue;
        const item = live[i];
        const positioned = entries.filter(e => !used.has(e) && e.text === item.text && Math.abs(e.position - item.position) < 8 && (!item.key || !e.key || item.key === e.key));
        if (positioned.length === 1) { accept(i, positioned[0]); continue; }
        // Never collapse multiple identical “继续” prompts into one entry.
        if (live.filter(e => e.text === item.text).length !== 1) continue;
        const candidates = entries.filter(e => !used.has(e) && e.text === item.text && (!item.key || !e.key || item.key === e.key));
        if (candidates.length === 1 && (item.key || matches.some(Boolean) || Math.abs(item.position - candidates[0].position) < 24)) accept(i, candidates[0]);
      }
      const hasAnchor = matches.some(Boolean);
      let previous = null;
      for (let i = 0; i < live.length; i++) {
        let record = matches[i];
        if (!record) {
          record = { id: ++this.serial };
          const next = matches.slice(i + 1).find(Boolean);
          const at = next ? entries.indexOf(next) : previous ? entries.indexOf(previous) + 1 : hasAnchor || direction >= 0 ? entries.length : 0;
          entries.splice(at, 0, record);
        }
        Object.assign(record, live[i]);
        this.nodeIds.set(live[i].node, record.id);
        previous = record;
        matches[i] = record;
      }
      entries.forEach((record, index) => {
        record.index = index;
        if (!record.node?.isConnected) record.node = null;
      });
      this.lastLive = matches.map(e => ({ id:e.id, text:e.text, position:e.position }));
      this.signature = entries.map(e => `${e.id}:${e.text}:${!!e.node?.isConnected}`).join('\n');
      return oldSignature !== this.signature;
    }
    detach() { this.entries.forEach(e => { e.node = null; }); this.lastLive = []; }
  }
  globalThis.QuestionMapHistory = QuestionMapHistory;
  if (typeof module !== 'undefined') module.exports = QuestionMapHistory;
})();
