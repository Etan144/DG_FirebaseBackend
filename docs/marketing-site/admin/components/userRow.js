export function UserRow(u) {
  const email = u.email || "(no email)";
  const disabled = u.disabled === true;

  return `
    <tr>
      <td>${email}</td>

      <td>
        <span class="badge ${disabled ? "danger" : "success"}">
          ${disabled ? "Disabled" : "Active"}
        </span>
      </td>

      <td>
        <button
          class="btn sm ${disabled ? "secondary" : "warning"}"
          data-action="toggle-user"
          data-uid="${u.uid}"
          data-disabled="${disabled ? "1" : "0"}"
        >
          ${disabled ? "Enable" : "Disable"}
        </button>

        <button
          class="btn sm danger"
          data-action="delete-user"
          data-uid="${u.uid}"
        >
          Delete
        </button>
      </td>
    </tr>
  `;
}
