// make text input not clear on refresh
const json_input = document.querySelector("#jsn")
if (window.localStorage["json_input.last_value"] === undefined) window.localStorage["json_input.last_value"] = "";
json_input.value = window.localStorage["json_input.last_value"]; 
json_input.addEventListener("change", () => window.localStorage["json_input.last_value"] = json_input.value)

const links = document.querySelectorAll("link");for (var i = 0; i < links.length; i++) {const link = links[i];if (link.rel === "stylesheet") {link.href = `${link.href.split("?t=")[0]}?t=${+Date.now()}`;}}


const status_body = document.querySelector(".status")
const status_header = document.querySelector(".status .header")
const status_body_text = document.querySelector(".status .body")

let hiding = true;
const hide_btn = document.createElement("button");
hide_btn.textContent = "hide";
hide_btn.setAttribute("title", "Hide status box")
function makeHideButton() {
  const btn = hide_btn.cloneNode(true);
  btn.setAttribute("id", "hide");
  btn.addEventListener("click", () => {
    status_body.classList.add("hidden")
    setTimeout(() => show_error("", { stack: "" }, true), 250)
  })
  return btn;
}

function show_error(name, err, silent, buttons=["hide"]) {
  let ran;
  while (buttons.findIndex(_=>_=="hide") !== -1) {
    ran = true;
    buttons[buttons.findIndex(_=>_=="hide")] = makeHideButton();
  }
  if (!ran) buttons.push(makeHideButton());
  const name_elem = document.createElement("span"); 
  name_elem.setAttribute("id", "name");
  name_elem.innerText = name;
  buttons.unshift(name_elem);
  status_header.innerHTML = "";
  for (const elem of buttons) status_header.appendChild(elem);
  status_body_text.innerText = err?.stack || err?.message ||  err || "unknown";

  if (!silent) status_body.classList.remove("hidden")
}
// /\ errors

function setTitle(text="", append) {
  const title_elem = document.querySelector("head > title")
  const site_name = "Emoji Previewer"
  if (!(text).trim()) return title_elem.innerText = site_name;
  title_elem.innerText = (!append) ? text + " - " + site_name : site_name + " - " + text;
}
setTitle()

// \/ control
const run_btn = document.querySelector("#run");
const fmt_btn = document.querySelector("#fmt");
const back_btn = document.querySelector("#back")

fmt_btn.addEventListener("click", () => {
  let parsed = parse_textarea_value(json_input);
  if (!parsed) return;
  try {
    json_input.value = JSON.stringify(parsed, 0, 4);
  } catch (e) {
    console.error(e)
    show_error("Failed to format", e)	
  }
})

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
  textarea.setSelectionRange(line_begin,line_begin)
  textarea.focus()
  textarea.setSelectionRange(line_begin, char_at)
}


function run(emojis) {
  let parsed = emojis ?? parse_textarea_value();
  
  if (Array.isArray(parsed) === false) parsed = [parsed];

  for (const emoji of parsed) {
    console.log(emoji)
  }
  document.querySelector("body > .results").scrollIntoView({behavior: "smooth"})
}
run_btn.addEventListener("click", run)
function parse_textarea_value() {
  if (json_input.value.length === 0) {
    show_error("No input provided", {stack:"Put the array of JSONs in the field below"})
    json_input.focus()
  }
  let parsed;
  try {
    parsed = JSON.parse(json_input.value)
  } catch (e) {
    console.error(e)
    let a;
    const btns = ["hide"]
    if ((a = e.message.match(/\(line (\d+) column (\d+)\)/))) {

      const goto_btn = document.createElement("button");
      goto_btn.textContent = "jump";
      goto_btn.setAttribute("title", "Jump to the line mentioned in the error message")
      goto_btn.addEventListener("click", () => {
        select(Number(a[1]), Number(a[2]), json_input)
      })
      btns.unshift(goto_btn)
    }
    return show_error("Failed to parse input", e, false, btns)
  }
  return parsed;
}

back_btn.classList.remove("hidden")
back_btn.inert = false;
back_btn.addEventListener("click", () => document.querySelector("body > .input").scrollIntoView({behavior: "smooth"}))

document.addEventListener("keyup", (event) => { 
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
  id: "881598836999610388",
  name: "larry_cry",
  roles: [],
  require_colons: true,
  managed: false,
  animated: false,
  available: true
})
