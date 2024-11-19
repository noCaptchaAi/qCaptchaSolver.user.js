// ==UserScript==
// @name         hCaptcha Solver by noCaptchaAi BETA
// @name:ar      noCaptchaAI hCaptcha Solver حلال
// @name:ru      noCaptchaAI Решатель капчи hCaptcha
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      3.8.5
// @run-at       document-start
// @description  hCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @description:ar تجاوز برنامج Captcha Solver الآلي لخدمة hCaptcha Solver خدمة Ai. 6000 🔥 حل / شهر مجاني! 50x⚡ أسرع من 2Captcha وغيرها
// @description:ru hCaptcha Solver автоматизирует решение Captcha Solver в обход сервиса Ai. Бесплатно 6000 🔥решений/месяц! В 50 раз⚡ быстрее, чем 2Captcha и другие
// @description:zh-CN hCaptcha Solver 自动绕过 Ai 服务的 Captcha Solver。 免费 6000 🔥解决/月！ 比 2Captcha 和其他人快 50x⚡
// @author       noCaptcha AI and Diego
// @match        https://newassets.hcaptcha.com/captcha/*
// @match        https://www.google.com/recaptcha/api2/*
// @match        https://config.nocaptchaai.com/*
// @icon         https://avatars.githubusercontent.com/u/110127579
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @updateURL    https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolverBeta.user.js
// @downloadURL  https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolverBeta.user.js
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_listValues
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// ==/UserScript==
const searchParams = new URLSearchParams(location.hash);
const isWidget = "checkbox" === searchParams.get("#frame");
const open = XMLHttpRequest.prototype.open;
const Toast = Swal.mixin({
    position: "top-end",
    showConfirmButton: false,
    timer: 1000
})
const cfg = new config({
    APIKEY: "",
    PLAN: "free",
    DELAY: 3,
    LOOP: false,
    HCAPTCHA: true,
    RECAPTCHA: true,
    AUTO_SOLVE: true,
    DEBUG_LOGS: false,
    CHECKBOX_AUTO_OPEN: true,
});
const isApikeyEmpty = !cfg.get("APIKEY");
let copy, sitekey;

XMLHttpRequest.prototype.open = function() {
    this.addEventListener("load", async function() {
        if(isApikeyEmpty || !cfg.get("AUTO_SOLVE") || this.responseType === "arraybuffer" || !this.responseText) {
            return;
        }
        //temp
        if (this.responseURL.startsWith("https://www.google.com/recaptcha/api2/") && cfg.get("RECAPTCHA")) {
            if (!sitekey) {
                const url = new URL(this.responseURL);
                const uu = new URLSearchParams(url.search);
                sitekey = uu.get('k');
            }
            try {
                const data = JSON.parse(this.responseText.replace(')]}\'\n', ''));
                log(data);
                const type = data.at(5);
                const p = data.at(9);
                if (type === "audio") {
                    //return audio("https://www.google.com/recaptcha/api2/payload/audio.mp3?p="+ p +"&k=" + sitekey);
                } else if (type === "imageselect") {
                    const image = await getBase64FromUrl('https://www.google.com/recaptcha/api2/payload?p='+ p +'&k='+ sitekey)
                    const target = data.at(4).at(1).at(6);
                    return imageselect(image, 33, target)
                } else if (type === "nocaptcha") {
                    return;
                }
            } catch (e) {
                log(this.responseText);
            }
            return;
        }
        //

        if (!this.responseURL.startsWith("https://hcaptcha.com/getcaptcha/")) {
            return;
        }

        try {
            const data = JSON.parse(this.responseText);

            // if (data.pass || !data.success) {}

            const isMulti = data.request_type === "image_label_multiple_choice";
            const body = {
                images: {},
                target: data.requester_question.en,
                type: isMulti ? "multi" : "grid",
                choices: isMulti ? Object.keys(data.requester_restricted_answer_set) : [],
                method: "hcaptcha_base64",
                sitekey: searchParams.get("sitekey"),
                site: searchParams.get("host"),
                softid: "UserScript " + GM_info.script.version,
            }
            copy = [];
            for(let i = 0; i < data.tasklist.length; i++) {
                const url = data.tasklist[i].datapoint_uri;
                copy.push(url)
                body.images[i] = await getBase64FromUrl(url);
            }
            await solve(body, isMulti);
        } catch (e) {
            console.error(this.responseText);
        }
    });
    open.apply(this, arguments);
}

addMenu("⚙️ Settings", cfg.open, !isApikeyEmpty);
addMenu(isApikeyEmpty ? "Login" : "📈 Dashboard/ 💰 Buy Plan / 👛 Balance info", "https://dash.nocaptchaai.com")
addMenu("🏠 HomePage", "https://nocaptchaai.com");
addMenu("📄 Api Docs", "https://docs.nocaptchaai.com/category/api-methods");
addMenu("❓ Discord", "https://discord.gg/E7FfzhZqzA");
addMenu("❓ Telegram", "https://t.me/noCaptchaAi");

if(isWidget) {
    log("loop running in bg"); //document.hasFocus()

    GM_addValueChangeListener("APIKEY", function(key, oldValue, newValue, remote) {
        log("The value of the '" + key + "' key has changed from '" + oldValue + "' to '" + newValue + "'");
        location = location.href;
    });

}

if(location.hostname === "config.nocaptchaai.com") {

    const sp = new URLSearchParams(location.search); //temp

    if(sp.has("apikey") && sp.has("plan") && document.referrer === "https://dash.nocaptchaai.com/") {
        cfg.set("APIKEY", sp.get("apikey"));
        cfg.set("PLAN", sp.get("plan"));
        Toast.fire({
            title: "noCaptchaAi.com \n Config Saved Successfully."
        });
        history.replaceState({}, document.title, "/");
    }
    const template = document.getElementById("tampermonkey");
    const clone = template.content.cloneNode(true);
    const inputs = clone.querySelectorAll("input");

    for(const input of inputs) {
        const type = input.type === "checkbox" ? "checked" : "value";
        input[type] = cfg.get(input.id);
        input.addEventListener("change", function(e) {
            Toast.fire({
                title: "Your change has been saved"
            });
            cfg.set(input.id, e.target[type])
        })
    }

    document.querySelector("h1").after(clone);

}

while(!(!navigator.onLine || isApikeyEmpty)) {

    await sleep(1000)

    if(cfg.get("CHECKBOX_AUTO_OPEN") && isWidget) {
        const isSolved = document.querySelector("div.check")?.style.display === "block";
        if(isSolved && !cfg.get("LOOP")) {
            log("found solved");
            break;
        }
        fireMouseEvents(document.querySelector("#checkbox"))
    }
}

async function solve(body, isMulti) {
    try {
        const data = await apiFetch(body);
        switch(data.status) {
            case "new":
                log("⏳ waiting a second");
                await sleep(1000);
                data = await apiFetch({}, "status?id=" + data.id, "GET")
                break;
            case "solved":
                break;
            case "skip":
                log("⚠️ Seems this a new challenge, please contact noCaptchaAi!");
                break;
            default:
                log("😨 Unknown status", data.status);
        }

        return await (isMulti ? multiple : binary)(data)
    } catch (error) {
        console.error(error);
        alert(error)
    }
}

async function getBase64FromUrl(url) {
    const blob = await (await fetch(url)).blob();
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.addEventListener("loadend", function() {
            resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ""));
        });
        reader.addEventListener("error", function() {
            reject("❌ Failed to convert url to base64");
        });
    });
}
async function imageselect(image, type, target) {
    const htmlTarget = document.querySelector('.rc-imageselect-desc-no-canonical strong')?.textContent;
    const data = await apiFetch({
        images: {
            0: image
        },
        target: target || htmlTarget,
        type,
        method: "recaptcha2",
    }, "beta");
    const [wait, sent] = waitCal(data.solution.length);
    const cells = document.querySelectorAll('.rc-image-tile-wrapper');
    for (const index of data.solution) {
        await sleep(wait);
        fireMouseEvents(cells[index]);
    }
}
async function multiple(data) {
    //need to be test
    const [wait, sent] = waitCal(copy.length)
    const image = document.querySelector(".image")?.style.backgroundImage.replace(/url\("|"\)/g, "");
    const finger = copy.indexOf(image);
    if (finger === -1) {
        return;
    }
    log(finger);
    const answer = data.answer?.at(finger);
    if (!answer) {
        return;
    }
    const element = [...document.querySelectorAll(".answer-text")].find(element => element.textContent === answer)
    await sleep(wait);
    fireMouseEvents(element);
    await sleep(wait);
    fireMouseEvents(document.querySelector(".button-submit"))
    await sleep(sent); // temp
    multiple({ansswer: data.answer});
}
async function binary(data) {
    const solutions = data.solution;
    const solution = solutions.filter(index => index > 8);
    const [wait, sent] = data.timer || waitCal(solutions?.length);
    const cells = document.querySelectorAll(".task-image .image");
    for (const index of solutions) {
        await sleep(wait);
        fireMouseEvents(cells[index]);
    }
    await sleep(sent);
    log("☑️ sent!");
    fireMouseEvents(document.querySelector(".button-submit"));
    if (solution[0] && solutions[0] !== solution[0]) {
        return binary({ solution, timer: [wait, sent] })
    }
}
// async function audio(url) {
//     const arrayBuffer = await fetch(url).then(response => response.arrayBuffer());
//     const body = new FormData();
//     body.append("audio", new Blob([arrayBuffer], { type: "audio/mp3" }), "audio.mp3");
//     const data = await apiFetch(body, "audio")
//     document.querySelector("#audio-response").value = data.solution;
// }

async function apiFetch(body, v = "solve", method = "POST") {
    const tempcheck = v === "beta"; //until free and pro are available
    v = tempcheck ? "solve" : v;
    const response = await fetch("https://" + (tempcheck ? "beta" : cfg.get("PLAN")) + ".nocaptchaai.com/" + v, {
        method,
        headers: {
            "Content-Type": "application/json",
            apikey: cfg.get("APIKEY")
        },
        body: JSON.stringify(body)
    })
    const data = await response.json();
    log(data);
    return data;
}
function addMenu(name, url, check = true) {
    if(!check) {
        return;
    }

    GM_registerMenuCommand(name, function() {
        if(typeof url === "function") {
            url();
        } else {
            GM_openInTab(url, {
                active: true,
                setParent: true
            });
        }
    });
}
function fireMouseEvents(element) {
    if(!document.contains(element)) {
        return;
    }
    for (const eventName of ["mouseover", "mousedown", "mouseup", "click"]) {
        const eventObject = document.createEvent("MouseEvents"); //todo update
        eventObject.initEvent(eventName, true, false);
        element.dispatchEvent(eventObject);
    }
}
function config(data) {
    let openWin;

    function get(name) {
        return GM_getValue(name, "")
    }

    function set(name, value) {
        GM_setValue(name, value);
        // if (data.onSave) {
        // }
    }

    function open() {
        const windowFeatures = {
            location: "no",
            status: "no",
            left: window.screenX,
            top: window.screenY,
            width: 500,
            height: 500
        };

        const featuresArray = Object.keys(windowFeatures).map(key => key + "=" + windowFeatures[key]);

        openWin = window.open("https://config.nocaptchaai.com/", "_blank", featuresArray.join(","));
        openWin.moveBy(Math.round((window.outerWidth - openWin.outerWidth) / 2), Math.round((window.outerHeight - openWin.outerHeight) / 2));
        window.addEventListener("beforeunload", openWin?.close);
    }

    function close() {
        openWin?.close();
        openWin = undefined;
    }

    const storedKeys = GM_listValues();
    for(const name in data) {
        if(storedKeys.includes(name)) {
            set(name, get(name));
        } else if(data[name] !== undefined) {
            set(name, data[name]);
        } else {
            set(name, "");
        }
    }

    return { get, set, open, close };
}
function waitCal(len) {
    const math = (parseInt(cfg.get("DELAY")) * 1000) / len;
    let data = math < 350 ? [math + 100, math + 150] : [math, math];
    log(data[0], data[1]);
    return data;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function log() {
    cfg.get("DEBUG_LOGS") && console.log.apply(this, arguments)
}
