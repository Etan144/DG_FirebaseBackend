export function StatusBadge(disabled) {
  return disabled
    ? `<span class="badge badge-disabled">Disabled</span>`
    : `<span class="badge badge-active">Active</span>`;
}
