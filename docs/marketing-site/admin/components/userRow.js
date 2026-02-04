import { StatusBadge } from "./badge.js";

export function UserRow(user) {
  const actionLabel = user.disabled ? "Enable" : "Disable";
  return `
    <tr>
      <td>${user.email || "(no email)"}</td>
      <td>${StatusBadge(!!user.disabled)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn secondary sm" data-action="toggle-user" data-uid="${user.uid}" data-disabled="${user.disabled ? "1" : "0"}">${actionLabel}</button>
          <button class="btn danger sm" data-action="delete-user" data-uid="${user.uid}">Delete</button>
        </div>
      </td>
    </tr>
  `;
}
