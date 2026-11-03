// Inventory items. Icons are small inline SVGs (24x24 viewBox).
const svg = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ITEMS = {
  letter: {
    name: "The Count's letter",
    desc: '“My Friend.—Welcome to the Carpathians. I am anxiously expecting you… At the Borgo Pass my carriage will await you and will bring you to me.” Signed: Dracula.',
    icon: svg('<path d="M4 6h16v12H4z" fill="#e7d9b8" stroke="#6b4a2a"/><path d="M4 6l8 7 8-7" stroke="#6b4a2a"/><circle cx="12" cy="13" r="2.4" fill="#9c1420"/>'),
  },
  crucifix: {
    name: 'Crucifix',
    desc: 'A little gold crucifix on a string of beads. The landlady put it round my neck and said, “For your mother’s sake.”',
    icon: svg('<path d="M12 3v18M7 8h10" stroke="#f0c862" stroke-width="3"/><path d="M12 3v18M7 8h10" stroke="#fff3c4" stroke-width="1"/><circle cx="12" cy="2.5" r="1" fill="#c9a24a"/>'),
  },
  notebook: {
    name: 'Shorthand notebook',
    desc: 'My notebook, with the shorthand key Mina and I use. The Count cannot read a word of it.',
    icon: svg('<path d="M6 3h12v18H6z" fill="#3a1a14" stroke="#c9a77a"/><path d="M9 8c2-2 4 2 6 0M9 12h6M9 15c1 1 3-1 5 1" stroke="#e7d9b8"/>'),
  },
  lamp: {
    name: 'Silver lamp',
    desc: 'An antique silver lamp. Its flame burns without chimney or globe.',
    icon: svg('<path d="M5 17h12l2-3H7z" fill="#bfc3cc" stroke="#6d7280"/><path d="M17 15c3-1 3-4 1-5" stroke="#bfc3cc"/><path d="M8 13c0-3 2-4 2-7 1 2 3 3 2 7" fill="#ffb35c" stroke="#ffd28a"/>'),
  },
  gold: {
    name: 'Old gold',
    desc: 'Coins from the heap in the Count’s room: Roman, British, Austrian, Hungarian, Greek and Turkish, none less than three hundred years old.',
    icon: svg('<ellipse cx="9" cy="15" rx="6" ry="3" fill="#d9a83a" stroke="#7a5410"/><ellipse cx="15" cy="11" rx="6" ry="3" fill="#f0c862" stroke="#7a5410"/><ellipse cx="11" cy="7" rx="5" ry="2.5" fill="#e3b54a" stroke="#7a5410"/>'),
  },
  shovel: {
    name: 'Shovel',
    desc: 'Left by the workmen who filled the great boxes with earth.',
    icon: svg('<path d="M12 2v12" stroke="#7a5a3a" stroke-width="2"/><path d="M10 2h4" stroke="#7a5a3a" stroke-width="2"/><path d="M7 14h10l-1 5-4 3-4-3z" fill="#9aa0a8" stroke="#555a62"/>'),
  },
};
