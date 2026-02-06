export default function UserRow({ user, onToggle, onDelete }) {

  const disabled = user.disabled === true;

  return (
    <tr>
      <td>{user.email || "(no email)"}</td>

      <td>
        <span className={`badge ${disabled ? "danger" : "success"}`}>
          {disabled ? "Disabled" : "Active"}
        </span>
      </td>

      <td>

        <button
          className={`btn sm ${disabled ? "secondary" : "warning"}`}
          onClick={() =>
            onToggle(user.uid, !disabled)
          }
        >
          {disabled ? "Enable" : "Disable"}
        </button>

        <button
          className="btn sm danger"
          onClick={() => onDelete(user.uid)}
        >
          Delete
        </button>

      </td>
    </tr>
  );
}
