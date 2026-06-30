import { useState } from "react";
import type { WorldBook, WorldBookFixedEntry, WorldBookKeywordEntry } from "@ai-novel/core";
import { MarkdownEditor } from "./MarkdownEditor";

interface WorldBookPanelProps {
  worldBooks: WorldBook[];
  openWorldBookIds: string[];
  onUpdateWorldBooks: (wbs: WorldBook[]) => void;
  onToggleOpen: (bookId: string) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function WorldBookPanel({
  worldBooks,
  openWorldBookIds,
  onUpdateWorldBooks,
  onToggleOpen,
}: WorldBookPanelProps) {
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  const addBook = () => {
    const book: WorldBook = {
      id: generateId(),
      name: "新世界书",
      fixedEntries: [],
      keywordEntries: [],
    };
    onUpdateWorldBooks([...worldBooks, book]);
    setExpandedBookId(book.id);
  };

  const deleteBook = (bookId: string) => {
    onUpdateWorldBooks(worldBooks.filter((b) => b.id !== bookId));
    if (expandedBookId === bookId) setExpandedBookId(null);
  };

  const updateBook = (bookId: string, partial: Partial<WorldBook>) => {
    onUpdateWorldBooks(
      worldBooks.map((b) => (b.id === bookId ? { ...b, ...partial } : b))
    );
  };

  const addFixed = (bookId: string) => {
    const book = worldBooks.find((b) => b.id === bookId);
    if (!book) return;
    const entry: WorldBookFixedEntry = {
      id: generateId(),
      title: "新固定条目",
      content: "",
      order: book.fixedEntries.length + 1,
    };
    updateBook(bookId, {
      fixedEntries: [...book.fixedEntries, entry],
    });
  };

  const addKeyword = (bookId: string) => {
    const book = worldBooks.find((b) => b.id === bookId);
    if (!book) return;
    const entry: WorldBookKeywordEntry = {
      id: generateId(),
      title: "新关键词条目",
      keywordText: "",
      keywords: [],
      content: "",
      order: book.keywordEntries.length + 1,
    };
    updateBook(bookId, {
      keywordEntries: [...book.keywordEntries, entry],
    });
  };

  const updateFixed = (
    bookId: string,
    entryId: string,
    partial: Partial<WorldBookFixedEntry>
  ) => {
    const book = worldBooks.find((b) => b.id === bookId);
    if (!book) return;
    updateBook(bookId, {
      fixedEntries: book.fixedEntries.map((e) =>
        e.id === entryId ? { ...e, ...partial } : e
      ),
    });
  };

  const updateKeyword = (
    bookId: string,
    entryId: string,
    partial: Partial<WorldBookKeywordEntry>
  ) => {
    const book = worldBooks.find((b) => b.id === bookId);
    if (!book) return;
    const updated = book.keywordEntries.map((e) => {
      if (e.id !== entryId) return e;
      const next = { ...e, ...partial };
      if (partial.keywordText !== undefined) {
        next.keywords = partial.keywordText.split(/\s+/).filter((k) => k.length > 0);
      }
      return next;
    });
    updateBook(bookId, { keywordEntries: updated });
  };

  const deleteFixed = (bookId: string, entryId: string) => {
    const book = worldBooks.find((b) => b.id === bookId);
    if (!book) return;
    updateBook(bookId, {
      fixedEntries: book.fixedEntries.filter((e) => e.id !== entryId),
    });
  };

  const deleteKeyword = (bookId: string, entryId: string) => {
    const book = worldBooks.find((b) => b.id === bookId);
    if (!book) return;
    updateBook(bookId, {
      keywordEntries: book.keywordEntries.filter((e) => e.id !== entryId),
    });
  };

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h3 className="cute-section-title" style={{ margin: 0 }}>世界书列表</h3>
        <button className="cute-btn-sm" onClick={addBook}>
          + 新建世界书
        </button>
      </div>

      {worldBooks.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          还没有世界书。点击"新建世界书"创建。
        </p>
      )}

      {worldBooks.map((book) => {
        const isOpen = openWorldBookIds.includes(book.id);
        const isExpanded = expandedBookId === book.id;

        return (
          <div
            key={book.id}
            className="cute-card"
            style={{
              opacity: isOpen ? 1 : 0.5,
              padding: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: "8px 10px",
                alignItems: "center",
                background: "var(--cream)",
                borderBottom: isExpanded ? "1px solid var(--border-soft)" : "none",
                cursor: "pointer",
              }}
              onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
            >
              <span style={{ flex: 1 }}>
                <input
                  value={book.name}
                  onChange={(e) => updateBook(book.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="cute-input"
                  style={{ width: "100%", fontSize: 13, fontWeight: 600 }}
                />
              </span>
              <label
                style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--text-secondary)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="cute-checkbox"
                  checked={isOpen}
                  onChange={() => onToggleOpen(book.id)}
                />{" "}
                启用
              </label>
              <button
                className="cute-btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBook(book.id);
                }}
                title="删除世界书"
              >
                &times;
              </button>
            </div>

            {isExpanded && (
              <div style={{ padding: 10 }}>
                <h4 style={{ margin: "4px 0", fontSize: 13, color: "var(--text-secondary)" }}>
                  固定条目（始终注入）
                </h4>
                {book.fixedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: "1px solid var(--border-soft)",
                      borderRadius: "var(--radius-md)",
                      padding: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginBottom: 4,
                        alignItems: "center",
                      }}
                    >
                      <input
                        value={entry.title}
                        onChange={(e) =>
                          updateFixed(book.id, entry.id, { title: e.target.value })
                        }
                        className="cute-input"
                        style={{ flex: 1, fontSize: 13 }}
                      />
                      <label style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                        顺序:
                        <input
                          type="number"
                          value={entry.order}
                          onChange={(e) =>
                            updateFixed(book.id, entry.id, {
                              order: parseInt(e.target.value) || 0,
                            })
                          }
                          style={{ width: 40, marginLeft: 2, fontSize: 12 }}
                        />
                      </label>
                      <button
                        className="cute-btn-icon"
                        onClick={() => deleteFixed(book.id, entry.id)}
                      >
                        &times;
                      </button>
                    </div>
                    <MarkdownEditor
                      value={entry.content}
                      onChange={(c) =>
                        updateFixed(book.id, entry.id, { content: c })
                      }
                      minRows={2}
                    />
                  </div>
                ))}
                <button className="cute-btn-sm" onClick={() => addFixed(book.id)} style={{ marginBottom: 8 }}>
                  + 固定条目
                </button>

                <h4 style={{ margin: "8px 0 4px", fontSize: 13, color: "var(--text-secondary)" }}>
                  关键词条目（命中才注入）
                </h4>
                {book.keywordEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: "1px solid var(--border-soft)",
                      borderRadius: "var(--radius-md)",
                      padding: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginBottom: 4,
                        alignItems: "center",
                      }}
                    >
                      <input
                        value={entry.title}
                        onChange={(e) =>
                          updateKeyword(book.id, entry.id, { title: e.target.value })
                        }
                        className="cute-input"
                        style={{ flex: 1, fontSize: 13 }}
                      />
                      <label style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                        顺序:
                        <input
                          type="number"
                          value={entry.order}
                          onChange={(e) =>
                            updateKeyword(book.id, entry.id, {
                              order: parseInt(e.target.value) || 0,
                            })
                          }
                          style={{ width: 40, marginLeft: 2, fontSize: 12 }}
                        />
                      </label>
                      <button
                        className="cute-btn-icon"
                        onClick={() => deleteKeyword(book.id, entry.id)}
                      >
                        &times;
                      </button>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <input
                        value={entry.keywordText}
                        onChange={(e) =>
                          updateKeyword(book.id, entry.id, {
                            keywordText: e.target.value,
                          })
                        }
                        placeholder="关键词（空格分隔）"
                        className="cute-input"
                        style={{ width: "100%", fontSize: 13 }}
                      />
                    </div>
                    <MarkdownEditor
                      value={entry.content}
                      onChange={(c) =>
                        updateKeyword(book.id, entry.id, { content: c })
                      }
                      minRows={2}
                    />
                  </div>
                ))}
                <button className="cute-btn-sm" onClick={() => addKeyword(book.id)}>
                  + 关键词条目
                </button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
