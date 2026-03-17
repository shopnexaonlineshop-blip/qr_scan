(function () {
  const SERVER_URL = window.QR_SYNC_SERVER_URL || window.location.origin;
  const ROOM_ID = window.QR_SYNC_ROOM_ID || "pos-room";
  const APPEND_MODE = window.QR_SYNC_APPEND_MODE || false;

  const script = document.createElement("script");
  script.src = SERVER_URL + "/socket.io/socket.io.js";

  script.onload = function () {
    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => {
      console.log("QR POS connected");
      socket.emit("join-room", ROOM_ID);
    });

    socket.on("joined-room", (roomId) => {
      console.log("Joined room:", roomId);
    });

    socket.on("receive-scanned-data", ({ text }) => {
      fillFocusedElement(text);
    });

    function fillFocusedElement(text) {
      const el = document.activeElement;

      if (!el) {
        alert("No active input selected");
        return;
      }

      const tag = el.tagName?.toLowerCase();
      const type = (el.type || "").toLowerCase();
      const isTextInput =
        tag === "textarea" ||
        (tag === "input" &&
          !["checkbox", "radio", "file", "button", "submit", "reset"].includes(type));

      if (isTextInput) {
        const oldValue = el.value || "";
        const newValue = APPEND_MODE ? oldValue + text : text;

        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set || Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        )?.set;

        if (nativeSetter) {
          nativeSetter.call(el, newValue);
        } else {
          el.value = newValue;
        }

        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.focus();
        return;
      }

      if (el.isContentEditable) {
        if (APPEND_MODE) {
          el.textContent = (el.textContent || "") + text;
        } else {
          el.textContent = text;
        }

        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.focus();
        return;
      }

      alert("Focused element is not a text input");
    }
  };

  document.head.appendChild(script);
})();