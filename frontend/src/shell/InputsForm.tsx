import { useEffect, useId, useState, type FormEvent } from "react";
import type { InputField, Task } from "../spec/types";

function defaultsOf(fields: InputField[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""]));
}

interface Props {
  task: Task;
  onSubmit: (inputs: Record<string, string>) => void;
  onCancel: () => void;
}

// Shown before an on-demand run whose task has inputs. Values live here, never in the spec.
export function InputsForm({ task, onSubmit, onCancel }: Props) {
  const fields = task.inputs ?? [];
  // The function form of useState runs only on the first render, so defaults are read once per opening.
  const [values, setValues] = useState<Record<string, string>>(() => defaultsOf(fields));
  // useId makes ids that are unique on the page, to tie each <label> to its field.
  const baseId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(values);
  };

  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="modal" onClick={onCancel}>
      <form
        className="modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={`${baseId}-title`} className="modal__title">
          Run: {task.name}
        </h2>
        <p className="modal__goal">{task.goal}</p>

        {fields.map((field, i) => {
          const id = `${baseId}-${field.key}`;
          const value = values[field.key] ?? "";
          return (
            <div key={field.key} className="modal__field">
              <label htmlFor={id} className="modal__label">
                {field.label}
              </label>
              {field.kind === "longtext" ? (
                <textarea
                  id={id}
                  className="modal__input modal__input--long"
                  value={value}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  autoFocus={i === 0}
                />
              ) : field.kind === "file" ? (
                <>
                  <input id={id} className="modal__input" value={value} disabled />
                  <span className="modal__note">File uploads aren't supported yet, so the default is used.</span>
                </>
              ) : (
                <input
                  id={id}
                  className="modal__input"
                  value={value}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  autoFocus={i === 0}
                />
              )}
            </div>
          );
        })}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="modal__button modal__button--primary">
            Run
          </button>
        </div>
      </form>
    </div>
  );
}
