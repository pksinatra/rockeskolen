window.getNotationHTML = () =>
  document.getElementById("notation")?.innerHTML || "";

document.getElementById("export-notation-btn")
  ?.addEventListener("click", () => {
    const html = getNotationHTML();
    const output = document.getElementById("notation-html-output");

    if (!html) {
      output.value = "Ingen notasjon funnet.";
      return;
    }

    output.value = html;
    output.select();
  });
window.getPianoRollHTML = () => {
  const canvas = document.getElementById("roll");
  if (!canvas) return "";

  const dataURL = canvas.toDataURL("image/png");

  return `<img src="${dataURL}" alt="Piano-roll" />`;
};

document.getElementById("export-roll-btn")
  ?.addEventListener("click", () => {
    const html = getPianoRollHTML();
    const output = document.getElementById("roll-html-output");

    if (!html) {
      output.value = "Fant ikke piano-roll.";
      return;
    }

    output.value = html;
    output.select();
  });
