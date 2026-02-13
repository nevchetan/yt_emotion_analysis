"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { X, Loader, Send } from "lucide-react";

export default function ReplyWithAIModal({ comment, onClose, onSuccess }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSuggestions() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.post("/api/ai/suggest-reply", {
          commentText: comment?.text || "",
          emotion: comment?.emotion || "neutral",
        });
        const data = res.data;
        const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
        if (!isMounted) return;

        setSuggestions(list);
        setSelectedIndex(0);
        setReplyText(list[0]?.text || "");
      } catch (err) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to generate suggestions",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSuggestions();

    return () => {
      isMounted = false;
    };
  }, [comment]);

  async function handlePostReply() {
    if (!comment?.commentId) {
      setError("Missing comment ID for reply.");
      return;
    }

    if (!replyText.trim()) {
      setError("Reply text cannot be empty.");
      return;
    }

    setPosting(true);
    setError("");

    try {
      await axios.post("/api/yt/post-comment", {
        parentId: comment.commentId,
        replyText,
      });
      onSuccess();
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to post reply",
      );
    } finally {
      setPosting(false);
    }
  }

  function handleSelectSuggestion(index) {
    setSelectedIndex(index);
    setReplyText(suggestions[index]?.text || "");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-800">Reply with AI</h3>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">Original comment</p>
          <p className="mt-2 text-gray-800">{comment?.text}</p>
        </div>

        <div className="p-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader size={16} className="animate-spin" />
              Generating reply suggestions...
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((item, index) => (
                <button
                  key={`${item.text}-${index}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(index)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                    selectedIndex === index
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="text-xs text-gray-500">
                    {item.tone || "suggested"}
                  </div>
                  <div className="text-gray-800">{item.text}</div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Edit your reply
            </label>
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Write your reply here..."
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handlePostReply}
            disabled={posting}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {posting ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Post Reply
          </button>
        </div>
      </div>
    </div>
  );
}
