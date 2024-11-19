// ==UserScript==
// @name         qCaptcha Solver by noCaptchaAi
// @name:ar      noCaptchaAI qCaptcha Solver حلال
// @name:ru      noCaptchaAI Решатель капчи qCaptcha
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      4.0.1
// @description  qCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @description:ar تجاوز برنامج Captcha Solver الآلي لخدمة qCaptcha Solver خدمة Ai. 6000 🔥 حل / شهر مجاني! 50x⚡ أسرع من 2Captcha وغيرها
// @description:ru qCaptcha Solver автоматизирует решение Captcha Solver в обход сервиса Ai. Бесплатно 6000 🔥решений/месяц! В 50 раз⚡ быстрее, чем 2Captcha и другие
// @description:zh-CN qCaptcha Solver 自动绕过 Ai 服务的 Captcha Solver。 免费 6000 🔥解决/月！ 比 2Captcha 和其他人快 50x⚡
// @author       noCaptcha AI and Diego
// @match        *://*/*
// @match        https://config.nocaptchaai.com/?apikey=*
// @icon         https://avatars.githubusercontent.com/u/110127579
// @require      https://greasyfork.org/scripts/395037-monkeyconfig-modern/code/MonkeyConfig%20Modern.js
// @updateURL    https://github.com/noCaptchaAi/qCaptchaSolver.user.js/raw/main/qCaptchaSolver.user.js
// @downloadURL  https://github.com/noCaptchaAi/qCaptchaSolver.user.js/raw/main/qCaptchaSolver.user.js
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_addElement
// @license      MIT
// ==/UserScript==

(async () => {
  "use strict";

  const cfg = new MonkeyConfig({
    title: "⚙️noCaptchaAi.com All Settings",
    params: {
      AUTO_SOLVE: {
        label: "Auto Solve",
        type: "checkbox",
        default: true,
      },
      CHECKBOX_AUTO_OPEN: {
        label: "Auto Open",
        type: "checkbox",
        default: true,
      },
      ALWAYS_SOLVING: {
        label: "Always Solving",
        type: "checkbox",
        default: true,
      },
      DEBUG_LOGS: {
        type: "checkbox",
        label: "Console logs",
        default: false,
      },
      APIKEY: {
        label: "APIKEY",
        type: "text",
        default: "",
      },
      PLAN: {
        type: "select",
        label: "noCaptchaAi Plan",
        choices: ["FREE", "PRO"],
        default: "FREE",
      },
      Custom_Endpoint: {
        type: "text",
        label: "Custom API",
        default: "",
      },
      DELAY_OPEN: {
        type: "number",
        label: "Delay Open",
        default: 1,
      },
      SOLVE_IN_SEC: {
        type: "number",
        label: "Solve In Seconds",
        default: 7,
      },
      SOLVE_IN_SEC_MULTI: {
        type: "number",
        label: "Solve In Seconds for Multiple Choice",
        default: 3,
      },
      LOOP: {
        type: "number",
        label: "Loop Interval In Sec",
        default: 1,
      },
    },
    onSave,
    menuCommand: true,
  });

  const searchParams = new URLSearchParams(location.hash);
  const logs = cfg.get("DEBUG_LOGS");
  let target_xhr = "";
  let lang_xhr = "";
  let req_q = {};
  let captype = "";

  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function () {
    this.addEventListener("readystatechange", onXHReady);
    open.apply(this, arguments);
  };

  let startTime;
  let stop = false;
  const v = GM_info.script.version;

  const freeApi = "https://free.nocaptchaai.com/api/";
  const freeBalApi = freeApi + "user/free_balance";
  const proBalApi = "https://manage.nocaptchaai.com/api/user/get_balance";
  let apikey = cfg.get("APIKEY");

  function log(msg) {
    if (logs) {
      console.log(
        `%cnoCaptchaAi.com ~ %c${msg}`,
        "background: #222; color: #bada55",
        ""
      );
    }
  }

  (() => {
    GM_addStyle(`
      .swal2-container {
        z-index: 9990;
      }
    `);
  })();

  // if (location.search.startsWith("?apikey=")) {
  if (location.hostname === "config.nocaptchaai.com") {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });

    if (
      params.apikey &&
      params.plan &&
      (document.location.host === "config.nocaptchaai.com" ||
        document.referrer === "https://dash.nocaptchaai.com/")
    ) {
      cfg.set("APIKEY", params.apikey);
      cfg.set("PLAN", params.plan);
      cfg.set("Custom_Endpoint", params.custom_api || "");

      cfg.open();
      if (document.getElementById("__MonkeyConfig_frame")) {
        let iframe = document.getElementById("__MonkeyConfig_frame");
        let innerDoc = iframe.contentDocument || iframe.contentWindow.document;
        innerDoc.getElementById("__MonkeyConfig_button_save")?.click();
        if (logs) console.log(iframe);
        if (logs) console.log(innerDoc);
      }

      console.log(cfg.get("APIKEY"), cfg.get("PLAN"));
    }

    const get_endpoint = "https://manage.nocaptchaai.com/api/user/get_endpoint";

    const apikey = cfg.get("APIKEY");
    console.log(apikey, cfg.get("APIKEY"));

    if (apikey.length < 0) {
      throw new Error("empty apikey");
    } else {
      (async () => {
        let res = await fetch(get_endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: apikey,
          },
        });
        res = await res.json();
        console.log(res);
        if (res.error) {
          jsNotif(res.error + "\n noCaptchaAi Extension Config failed ✘");
          cfg.set("APIKEY", "");
        } else if (res.plan === "free") {
          jsNotif("noCaptchaAi Extension \n Config Successful ✔️");

          const iframes = [...document.querySelectorAll("[src*=newassets]")];
          for (const iframe of iframes) {
            const url = iframe.src;
            iframe.src = "about:blank";
            setTimeout(function () {
              iframe.src = url;
            }, 10);
          }
        } else if (res.plan !== null || "free") {
          jsNotif(
            `noCaptchaAi Extension ${res.plan} plan \n Config Successful ✔️`
          );
        }
      })();
    }
  }

  if (window.top === window) {
    if (logs) {
      const autoOpen = cfg.get("CHECKBOX_AUTO_OPEN");
      const autoSolve = cfg.get("AUTO_SOLVE");
      log(`auto open: ${autoOpen} | auto solve: ${autoSolve}`);
    }
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: apikey,
  };

  const autoOpen = cfg.get("CHECKBOX_AUTO_OPEN");
  const autoSolve = cfg.get("AUTO_SOLVE");
  log(`auto open: ${autoOpen} | auto solve: ${autoSolve}`);

  // Define an array of menu commands with labels and URLs
  const menuCommands = [
    { label: "🏠 HomePage", url: "https://nocaptchaai.com" },
    {
      label: "📈 Dashboard /💰 Buy Solves /💲 Balance",
      url: "https://dash.nocaptchaai.com",
    },
    {
      label: "📄 Api Docs",
      url: "https://docs.nocaptchaai.com",
    },
    { label: "❓ Discord", url: "https://discord.gg/E7FfzhZqzA" },
    { label: "❓ Telegram", url: "https://t.me/noCaptchaAi" },
  ];

  // Register each menu command with GM_registerMenuCommand
  menuCommands.forEach(({ label, url }) => {
    GM_registerMenuCommand(label, () => {
      if (window.top === window) {
        GM_openInTab(url, {
          active: true,
          setParent: true,
        });
      }
    });
  });

  async function jsNotif(textContent) {
    const container = document.createElement("div");
    container.id = "jsNotif";
    container.style.position = "fixed";
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
    container.style.background = "linear-gradient(to right, #00b4db, #0083b0)";
    container.style.color = "#fff";
    container.style.fontSize = "25px";
    container.style.padding = "30px";
    container.style.borderRadius = "10px";
    container.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)";

    document.body.appendChild(container);

    const delay = 15; // Adjust this to control the typing speed

    for (let i = 0; i < textContent.length; i++) {
      await sleep(delay); // Pause before adding the next character
      container.textContent += textContent[i];
    }

    const style = document.createElement("style");
    style.textContent = `@keyframes fade-in-out {
      0% {
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  
    #jsNotif {
      animation: fade-in-out 3s ease-in-out forwards;
    }`;

    document.head.appendChild(style);
  }

  while (!(!navigator.onLine || stop || !apikey)) {
    await sleep(cfg.get("LOOP") * 1000);

    if (cfg.get("CHECKBOX_AUTO_OPEN") && isWidget()) {
      const isSolved =
        document.querySelector("div.check")?.style.display === "block";
      if (isSolved) {
        log("found solved");
        if (cfg.get("ALWAYS_SOLVING") === false) break;
      }
      await sleep(cfg.get("DELAY_OPEN"));
      document.querySelector("#checkbox")?.click();
    } else if (
      cfg.get("AUTO_SOLVE") &&
      document.querySelector("h2.prompt-text") !== null
    ) {
      if (cfg.get("DEBUG_LOGS") === true) log("opening box");
      await solve();
    }
  }

  function isWidget() {
    const rect = document.body.getBoundingClientRect();
    if (rect?.width === 0 || rect?.height === 0) {
      return false;
    }
    return document.querySelector("div.check") !== null;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function randTimer(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  async function getBase64FromUrl(url) {
    const blob = await (await fetch(url)).blob();
    return new Promise(function (resolve) {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.addEventListener("loadend", function () {
        resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ""));
      });
      reader.addEventListener("error", function () {
        log("❌ Failed to convert url to base64");
      });
    });
  }

  async function solve() {
    // if (captype === "grid") {
    //   await sleep(2000);
    //   document.querySelector(".button-submit").click();
    //   return;
    // }

    const { target, cells, images, example, choices } = await onTaskReady();

    if (!cfg.get("AUTO_SOLVE")) {
      return;
    }
    startTime = new Date();
    const searchParams = new URLSearchParams(location.hash);

    try {
      const ob = { ...req_q };
      const pText = document.querySelector(".prompt-text")?.textContent; // use destructuring to extract the textContent property safely
      ob.frame = pText;
      let response = await fetch(getApi("solve"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          images,
          target,
          altln: ob,
          method: "qCaptcha_base64",
          type: captype,
          choices: captype === "multi" ? choices : [],
          sitekey: searchParams.get("sitekey"),
          site: searchParams.get("host"),
          ln:
            lang_xhr !== ""
              ? "en"
              : document.documentElement.lang || navigator.language,
          softid: "Userscript_v" + v,
        }),
      });

      response = await response.json();
      const clicktime = randTimer(300, 450);
      const sfl = shuffle(response.solution);
      let clicks = 0;

      if (cfg.get("DEBUG_LOGS") === true) console.table(response);

      if (response.error || response.status === "skip") {
        console.log(response.message);
        jsNotif("⚠" + response.message);
      } else if (response.status === "new") {
        if (captype === "multi") {
          const res = response.answer;
          console.log(res, "res");
          for (const e in res) {
            const ele = [...document.querySelectorAll(".answer-text")].find(
              (element) => res.some((e) => element.outerText === e)
            );
            console.log(ele.children?.outerText);
            fireMouseEvents(ele);
            await sleep(400);
            document.querySelector(".submit-button")?.click();
          }
        } else if (captype === "grid") {
          await sleep(2000);
          const status = await (await fetch(response.url)).json();
          for (const index of status.solution) {
            cells[index].click();
            await sleep(clicktime);
          }
        }
      } else if (response.status === "solved") {
        if (captype === "multi") {
          const res = response.answer;
          console.log(res, "res");

          for (const e in res) {
            const ele = [...document.querySelectorAll(".answer-text")].find(
              (element) => res.some((e) => element.outerText === e)
            );
            console.log(ele.children?.children?.outerText);
            await sleep(200);
            fireMouseEvents(ele);

            // document.querySelector(".submit-button")?.click();

            const clicked = [
              ...document.querySelectorAll(".answer-example"),
            ].some((el) => el.style.backgroundColor === "rgb(116, 116, 116)");

            if (!clicked) {
              fireMouseEvents(ele);
            }

            await sleep(500);

            clicks = +1;
          }
        } else if (captype === "grid") {
          for (const index of sfl) {
            cells[index].click();
            await sleep(clicktime);
          }
        }
      }

      console.log("multi hcap ~ clicks", clicks);
      const ET = new Date() - startTime;
      const RT =
        (captype === "multi"
          ? cfg.get("SOLVE_IN_SEC_MULTI")
          : cfg.get("SOLVE_IN_SEC")) *
          1000 -
        ET;
      await sleep(RT);

      if (logs) log("☑️ sent!");
      document.querySelector(".button-submit").click();
      startTime = 0;
    } catch (error) {
      console.error(error);
    }
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  function fireMouseEvents(element) {
    ["mouseover", "mousedown", "mouseup", "click"].forEach((eventName) => {
      if (element.fireEvent) {
        element.fireEvent("on" + eventName);
      } else {
        const eventObject = document.createEvent("MouseEvents");
        eventObject.initEvent(eventName, true, false);
        element.dispatchEvent(eventObject);
      }
    });
  }

  function getApi(v) {
    if (cfg.get("Custom_Endpoint")) {
      if (logs) console.log("custom", cfg.get("Custom_Endpoint"));
      return cfg.get("Custom_Endpoint") + v;
    } else {
      return "https://" + cfg.get("PLAN") + ".nocaptchaai.com/" + v;
    }
  }

  function onSave({ APIKEY }) {
    try {
      if (headers.apikey === apikey || apikey === "")
        throw new Error("empty or eq");
      GM_xmlhttpRequest({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: APIKEY,
        },
        responseType: "json",
        url: "https://manage.nocaptchaai.com/api/user/get_endpoint",
        onload: function ({ response }) {
          if (response.error) {
            cfg.set("APIKEY", "");
            return jsNotif(response.error);
          }
          cfg.set("PLAN", response.plan === "prepaid" ? "pro" : "free");
        },
      });
    } catch (error) {
      log(error);
    } finally {
      log("reload");
      const iframes = [...document.querySelectorAll("[src*=newassets]")];
      for (const iframe of iframes) {
        const url = iframe.src;
        iframe.src = "about:blank";
        setTimeout(function () {
          iframe.src = url;
        }, 10);
      }
    }
  }

  async function onXHReady() {
    // Check if responseType is not empty and responseText is available
    if (this.responseType === "" && this.responseText) {
      const resurl = this.responseURL;
      // console.log(typeof this.responseText);
      let pRes = {};
      try {
        pRes = JSON.parse(this.responseText);
      } catch (error) {
        console.warn(error);
      }
      const rq = pRes?.requester_question;
      if (resurl.startsWith("https://qCaptcha.com/getcaptcha")) {
        target_xhr = rq?.en;
        lang_xhr = "en";
        captype =
          pRes.request_type == "image_label_multiple_choice" ? "multi" : "grid";
        if (logs) console.log("target_xhr :", target_xhr, "captype :", captype);
      } else {
        const searchParams = new URL(resurl).searchParams;
        const sitekey = searchParams?.get("sitekey");

        if (resurl.endsWith(`getcaptcha/${sitekey}`)) {
          target_xhr = requesterQuestion?.en;
          lang_xhr = "en";
          if (logs) console.log("target_xhrSitekey", target_xhr);
        }
      }
    }
  }

  function onTaskReady(i = 500) {
    return new Promise(async (resolve) => {
      const check_interval = setInterval(async function () {
        let targetText = target_xhr
          ? target_xhr
          : document.querySelector(".prompt-text")?.textContent;
        if (!targetText) return;

        let cells = null;
        let images = {};
        let example = {};
        let choices = [];

        if (captype === "grid") {
          // console.log("grid");
          cells = document.querySelectorAll(".task-image .image");
          if (cells.length !== 9) return;

          for (let i = 0; i < cells.length; i++) {
            const img = cells[i];
            if (!img) return;
            const url =
              img.style.background?.match(/url\("(.*)"/)?.at(1) || null;
            if (!url || url === "") return;
            // images[i] = await getBase64FromUrl(url);
            images[i] = await getBase64FromUrl(url);
          }
        } else if (captype === "multi") {
          console.log("multi");
          const bg = document.querySelector(".task-image .image-wrapper .image")
            ?.style.background;
          let singleImg = "";
          try {
            singleImg =
              (await getBase64FromUrl(bg.match(/url\("(.*)"/)?.at(1))) || "";
          } catch (e) {
            console.log(e);
          }
          if (!example) return;

          Object.assign(images, { [Object.keys(images).length]: singleImg });

          console.log("images", images);
          const answerTextElements = document.querySelectorAll(".answer-text");
          choices = Array.from(answerTextElements).map((el) => el.outerText);
        }

        clearInterval(check_interval);
        return resolve({
          target: targetText,
          cells,
          images,
          example,
          choices,
        });
      }, i);
    });
  }
})();
