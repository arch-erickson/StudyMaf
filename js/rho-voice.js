/*
 * Rho's local voice. Kokoro is an Apache-2.0 open-weight TTS model that runs
 * in the learner's browser. The model is fetched in the background when Rho
 * opens, then the browser cache keeps it for later visits.
 */
const KOKORO_MODULE = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";
const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const RHO_VOICE = "af_bella";

let model = null;
let loading = null;
let player = null;

function cleanText(value) {
  return String(value || "")
    .replace(/ANSWER:\s*/gi, "")
    .replace(/STEPS:\s*/gi, "")
    .replace(/FINAL:\s*/gi, "")
    .replace(/\$\$?/g, "")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2")
    .replace(/\\sqrt\{([^}]+)\}/g, "square root of $1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1800);
}

async function prepare(onStatus) {
  if (model) return model;
  if (!loading) {
    loading = (async function () {
      onStatus && onStatus("Downloading Rho's open-source voice for the first time...");
      const packageExports = await import(KOKORO_MODULE);
      const KokoroTTS = packageExports.KokoroTTS;
      model = await KokoroTTS.from_pretrained(KOKORO_MODEL, {
        // q4 keeps the initial download manageable while still sounding natural.
        dtype: "q4",
        device: "wasm",
        progress_callback: function (event) {
          if (!onStatus || !event) return;
          if (event.status === "progress" && typeof event.progress === "number") {
            onStatus("Downloading Rho's voice: " + Math.round(event.progress) + "%");
          }
        }
      });
      return model;
    })().catch(function (error) {
      loading = null;
      model = null;
      throw error;
    });
  }
  return loading;
}

function stop() {
  if (!player) return;
  player.pause();
  if (player.src) URL.revokeObjectURL(player.src);
  player = null;
}

async function speak(value, options) {
  options = options || {};
  const text = cleanText(value);
  if (!text) return;
  stop();
  const tts = await prepare(options.onStatus);
  options.onStatus && options.onStatus("Rho is speaking...");
  const audio = await tts.generate(text, { voice: RHO_VOICE, speed: 1.02 });
  if (!audio || typeof audio.toBlob !== "function") throw new Error("The open-source voice did not return playable audio.");
  const url = URL.createObjectURL(await audio.toBlob());
  await new Promise(function (resolve, reject) {
    player = new Audio(url);
    player.onended = function () { URL.revokeObjectURL(url); player = null; resolve(); };
    player.onerror = function () { URL.revokeObjectURL(url); player = null; reject(new Error("The voice audio could not play.")); };
    player.play().catch(function (error) { URL.revokeObjectURL(url); player = null; reject(error); });
  });
}

window.RhoVoice = { prepare: prepare, speak: speak, stop: stop, voice: RHO_VOICE };
