(() => {
  const room = document.querySelector(".room");
  const floor = room?.querySelector(".room-floor");
  const object = room?.querySelector(".room-object");
  const button = room?.querySelector("#lower-floor");
  const status = room?.querySelector("#floor-status");

  if (!room || !floor || !object || !button || !status) return;

  const labels = ["floor 0", "floor -1", "floor -2", "floor -3", "floor is elsewhere."];
  let state = 0;

  button.addEventListener("click", () => {
    state = (state + 1) % labels.length;
    room.dataset.floor = String(state);
    status.textContent = labels[state];
    button.textContent = state === 4 ? "[ put it back ]" : "[ lower the floor ]";
  });

  button.hidden = false;
})();
