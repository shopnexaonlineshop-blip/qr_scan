(function () {
  const SERVER_URL = window.QR_SYNC_SERVER_URL || window.location.origin;
  const ROOM_ID = window.QR_SYNC_ROOM_ID || "pos-room";
  const APPEND_MODE = window.QR_SYNC_APPEND_MODE || false;

  let lastFocusedElement = null;

  document.addEventListener(
    "focusin",
    (e) => {
      const el = e.target;
      if (!el) return;

      const tag = el.tagName?.toLowerCase();
      const type = (el.type || "").toLowerCase();

      const isTextInput =
        tag === "textarea" ||
        (tag === "input" &&
          !["checkbox", "radio", "file", "button", "submit", "reset"].includes(type));

      if (isTextInput || el.isContentEditable) {
        lastFocusedElement = el;
      }
    },
    true
  );

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

    function setNativeValue(element, value) {
      const tag = element.tagName?.toLowerCase();

      let prototype;
      if (tag === "textarea") {
        prototype = window.HTMLTextAreaElement.prototype;
      } else if (tag === "input") {
        prototype = window.HTMLInputElement.prototype;
      } else {
        element.textContent = value;
        return;
      }

      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
      const setter = descriptor && descriptor.set;

      if (setter) {
        setter.call(element, value);
      } else {
        element.value = value;
      }
    }

    function triggerReactEvents(element) {
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    }

    function fillFocusedElement(text) {
      const el = lastFocusedElement || document.activeElement;

      if (!el) {
        console.log("No focused input found");
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

        setNativeValue(el, newValue);
        triggerReactEvents(el);
        el.focus();
        return;
      }

      if (el.isContentEditable) {
        el.textContent = APPEND_MODE ? (el.textContent || "") + text : text;
        triggerReactEvents(el);
        el.focus();
        return;
      }

      console.log("Focused element is not supported");
    }
  };

  document.head.appendChild(script);
})();
