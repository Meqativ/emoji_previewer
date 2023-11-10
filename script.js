// make text input not clear on refresh
const json_input = document.querySelector("#jsn")
if (window.localStorage["json_input.last_value"] === undefined) window.localStorage["json_input.last_value"] = "";
json_input.value = window.localStorage["json_input.last_value"]; 
json_input.addEventListener("change", () => window.localStorage["json_input.last_value"] = json_input.value)
const checkbox_containers  = document.querySelectorAll('.toggle_container:has(input[type="checkbox"])');
checkbox_containers.forEach((container)=>{
  const [label, checkbox] = container.children;
  const variableName = checkbox.id.slice(1);
  checkbox.checked = window.localStorage[variableName] !== undefined ? window.localStorage[variableName] === "true" ? 1 : 0 : checkbox.getAttribute("default") === "true" ? 1 : 0;

  checkbox.addEventListener('change', () => {
    window.localStorage[variableName]  = checkbox.checked;
  });
})

const status_body = document.querySelector(".status"),
  status_header = document.querySelector(".status .header"),
  status_body_text = document.querySelector(".status .body");

let hiding = true;
const hide_btn = document.createElement("button");
hide_btn.textContent = "hide";
hide_btn.setAttribute("title", "Hide status box");
function makeHideButton() {
  const btn = hide_btn.cloneNode(true);
  btn.setAttribute("id", "hide");
  btn.addEventListener("click", () => {
    status_body.classList.add("hidden");
    setTimeout(() => show_error("", { stack: "" }, true), 250);
  });
  return btn;
}

function show_error(name, err, silent, buttons=["hide"]) {
  let ran;
  while (buttons.findIndex(e => e === "hide") !== -1) {
    ran = true;
    buttons[buttons.findIndex(e =>e === "hide")] = makeHideButton();
  }
  if (!ran) buttons.push(makeHideButton());
  const name_elem = document.createElement("span"); 
  name_elem.setAttribute("id", "name");
  name_elem.innerText = name;
  buttons.unshift(name_elem);
  status_header.innerHTML = "";
  for (const elem of buttons) status_header.appendChild(elem);
  status_body_text.innerText = err?.stack || err?.message || err || "unknown";

  if (!silent) status_body.classList.remove("hidden");
}
// /\ errors

function setTitle(text="", append) {
  const title_elem = document.querySelector("head > title"),
    site_name = "Emoji Previewer"
  if (!(text).trim()) return title_elem.innerText = site_name;
  title_elem.innerText = (!append) ? text + " - " + site_name : site_name + " - " + text;
}
setTitle();

// \/ control
const run_btn = document.querySelector("#run"),
  fmt_btn = document.querySelector("#fmt"),
  back_btn = document.querySelector("#back");

fmt_btn.addEventListener("click", () => {
  let parsed = parse_textarea_value(json_input);
  if (!parsed) return;
  try {
    json_input.value = JSON.stringify(parsed, 0, 4);
  } catch (e) {
    console.error(e);
    show_error("Failed to format", e);
  }
});

function select(line, column, textarea){
  line -= 1;
  let char_at = 0;
  let line_begin;
  const lines = textarea.value.split("\n");
  for (let l = 0; l < lines.length; l++) {
    const piece = lines[l];
    if (l === line) {
      line_begin = char_at + 0;
      char_at += column;
      break;
    }
    char_at += piece.length + 1;
  }
  textarea.setSelectionRange(line_begin,line_begin);
  textarea.focus();
  textarea.setSelectionRange(line_begin, char_at);
}


async function run(toparse) {
  let emojis = toparse ?? parse_textarea_value();
  if (emojis === undefined) return show_error("No input provided", "test"); 
  if (Array.isArray(emojis) === false) emojis = [emojis];

  if (window.localStorage["wait"] === "true") {
    for (let i = 0; i < emojis.length; i++) {
      try {
        await add_emoji(emojis[i], i, EMOJI_SIZES.MAX);
      } catch (e) {
        console.error(e);
        let id;
        return show_error("Unable to add_emoji from index " + i + " " + (((id=emojis[i]?.id)) ? `(id: ${id})` : ''), e);
      }
    }
  } else {
    Promise.allSettled(emojis.map((e,i) => add_emoji(e, i, EMOJI_SIZES.MAX)))
    .then(
      rs => {
        if (rs.find(res=>res.status === "rejected")) show_error("There were some errors while loading the emojis", rs.filter(res=>res.status==="rejected").map(r=>r.stack).join("\n"))
      }
    )
  }

  document.querySelector("body > .results").scrollIntoView({ behavior: "smooth" });
}
run_btn.addEventListener("click", () => run());


function parse_textarea_value() {
  if (json_input.value.length === 0) {
    show_error("No input provided", { stack: "Put the array of JSONs in the field below" });
    json_input.focus();
  }
  let parsed;
  try {
    parsed = JSON.parse(json_input.value);
  } catch (e) {
    console.error(e);
    let matches;
    const btns = ["hide"];
    if ((matches = e.message.match(/\(line (\d+) column (\d+)\)/))) {
      const goto_btn = document.createElement("button");
      goto_btn.textContent = "jump";
      goto_btn.setAttribute("title", "Jump to the line mentioned in the error message");
      goto_btn.addEventListener("click", () => {
        select(Number(matches[1]), Number(matches[2]), json_input);
      });
      btns.unshift(goto_btn);
    }
    return show_error("Failed to parse input", e, false, btns);
  }
  return parsed;
}


const EMOJI_SIZES = {
  WTEXT: "44",
  NORMAL: "96",
  MAX: "4096",
}
function get_emoji_url(id,animated,size) {
  return `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "webp"}?size=${size??EMOJI_SIZES.MAX_JUMBO}&quality=lossless`
}

const emoji_results_elem = document.querySelector(".result > .emojis")

function add_emoji(emoji, i, size) {
  return new Promise((res,rej)=>{
    const emoji_img = new Image();
    const error = new Error(); error.data = emoji;
    if (!("id" in emoji)) throw (error.message = "No 'id' provided", error);
    if (!("animated" in emoji)) {
      console.info(`[emoji #${i}] > No 'animated' provided, fallbacking to static`);
      emoji.animated = false;
    }
    emoji_img.addEventListener("error", (err) => {
      console.error(err)
      rej({stack:"See errors in devtools near "+new Date().toLocaleTimeString()})
    })
    emoji_img.addEventListener("load", () => {
      res(emoji_img)
    })

    emoji_img.src = get_emoji_url(emoji.id, emoji.animated, size);
    emoji_results_elem.append(emoji_img)
  });
}  


back_btn.classList.remove("hidden")
back_btn.inert = false;
back_btn.addEventListener("click", () => document.querySelector("body > .input").scrollIntoView({ behavior: "smooth" }));

/*document.addEventListener("keyup", (event) => { 
  if (event.altKey !== true || event.code !== "KeyR") return; 
  let links = document.querySelectorAll("link"); 
  for (var i = 0; i < links.length; i++) { 
    const link = links[i]; 
    if (link.rel === "stylesheet") { 
      link.href = `${link.href.split("?t=")[0]}?t=${+Date.now()}`; 
    } 
  };   
});

run({
  id: "922831779457536010",
  name: "chorniy",
  roles: [],
  require_colons: true,
  managed: false,
  animated: false,
  available: true
})*/
