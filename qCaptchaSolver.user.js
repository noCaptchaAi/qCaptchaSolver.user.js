// ==UserScript==
// @name         hCaptcha Solver by noCaptchaAi
// @namespace    https://nocaptchaai.com
// @version      5.0.0
// @description  hCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @author       noCaptcha AI and Diego
// @icon         https://avatars.githubusercontent.com/u/110127579
// @match        https://newconfig.nocaptchaai.com/?APIKEY=*
// @match        https://newassets.hcaptcha.com/captcha/*
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// ==/UserScript==
const hash = Object.fromEntries(new URLSearchParams(location.hash.replace('#', '')));
const cfg = GM_getValue('settings', {})
const isApikeyEmpty = !cfg.APIKEY || !cfg.PLANTYPE;
const isVisible = true; // cfg.get('isVisible')

if (location.host === 'newconfig.nocaptchaai.com') {
    const params = Object.fromEntries(new URLSearchParams(location.search));
    GM_setValue('settings', params)
    return alert('saved');
} else if (hash.frame === 'checkbox') {
    GM_addValueChangeListener('settings', function(key, oldValue, newValue, remote) {
        console.log('reloading...');
        location = location.href;
    });
}

addMenu(isApikeyEmpty ? 'Login' : '📈 Dashboard/ 💰 Buy Plan / 👛 Balance info', 'https://dash.nocaptchaai.com')
addMenu('🏠 HomePage', 'https://nocaptchaai.com');
addMenu('❓ Discord', 'https://discord.gg/E7FfzhZqzA');
addMenu('❓ Telegram', 'https://t.me/noCaptchaAi');

let startTime;
let stop = false;

while(navigator.onLine || !isApikeyEmpty) {
    await sleep(1000);

    if (cfg.hCaptchaAutoOpen === 'true' && hash.frame === 'checkbox') {
        stop = true
        const isSolved = document.querySelector('[role=checkbox]').ariaChecked === 'true';
        const boxElement = document.querySelector('#checkbox');

        if (isVisible && boxElement.offsetParent === null) {
            break;
        }
        
        if(isSolved && cfg.hCaptchaAlwaysSolve === 'false') {
            console.log('found solved');
            break;
        }
        fireMouseEvents(boxElement)
    } else if (cfg.hCaptchaAutoSolve === 'true' && hash.frame === 'challenge') {
        await sleep(1000);
        await solve();
    }
}

function isMulti() {
    return document.contains(document.querySelector('.task-answers'));
}
function isGrid() {
    return document.querySelectorAll('.task-image .image').length === 9;
}
function isBbox() {
    return document.contains(document.querySelector('.bounding-box-example'));
}
function onTaskReady() {
    return new Promise(async (resolve) => {
        const check_interval = setInterval(async function () {
            const target = document.querySelector('.prompt-text')?.textContent;
            if (!target || stop == true) return;
            const images = {};
            const cells = document.querySelectorAll('.task-image .image');
            let examples = document.querySelectorAll(".challenge-example .image .image");
            examples = [...examples].map(el => el.style.backgroundImage.replace(/url\("|"\)/g, ''));

            if ((isGrid() || isMulti())) {
                stop = true;
                for (let i = 0; i < cells.length; i++) {
                    const url = cells[i].style.backgroundImage.replace(/url\("|"\)/g, '')
                    images[i] = await getBase64FromUrl(url);
                }
            } else if (isBbox()) {
                stop = true
                images[0] = sliceOG();;
            }

            clearInterval(check_interval);
            stop = false;
            return resolve({
                target,
                cells,
                images,
                examples: examples.map(async example => await getBase64FromUrl(example)),
                choices: [...document.querySelectorAll('.answer-text')].map(el => el.outerText)
            });
        }, 1000);
    });
}

function addMenu(name, url) {
    GM_registerMenuCommand(name, function() {
        GM_openInTab(url, {
            active: true,
            setParent: true
        });
    });
}
function getBase64FromUrl(url) {
    const blob = fetch(url).then(response => response.blob());
    return new Promise(async function(resolve, reject) {
        const reader = new FileReader();
        reader.readAsDataURL(await blob);
        reader.addEventListener('loadend', function() {
            resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ''));
        });
        reader.addEventListener('error', function() {
            reject('❌ Failed to convert url to base64');
        });
    });
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function fireMouseEvents(element, options = {}) {
    if(!document.contains(element)) {
        return;
    }

    const events = ['mouseover', 'mousedown', 'mouseup', 'click'];
    options.bubbles = true;
    for (let i = 0; i < events.length; i++) {
        const event = new MouseEvent(events[i], options);
        element.dispatchEvent(event);
    }
}
function apiFetch(body, v = 'solve', method = 'POST') {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            apikey: cfg.APIKEY,
            softid: 'UserScript ' + GM_info.script.version
        }
    }

    if (method !== 'GET') {
        options.body = JSON.stringify(body)
    }

    const promise = fetch('https://' + cfg.PLANTYPE + '.nocaptchaai.com/' + v, options)
    const value = promise.then(response => response.json()).then(async data => {
        if (data.url && data.status === 'new') {
            console.log('⏳ waiting a second');
            await sleep(1000);
            return await apiFetch({}, 'status?id=' + data.id, 'GET')
        }
        return data;
    })
    return value;
}

async function solve() {
    startTime = new Date();

    const { target, cells, images, examples, choices } = await onTaskReady();
    try {
        let data = await apiFetch({
            images,
            target,
            choices,
            examples: await Promise.all(examples),
            method: 'hcaptcha_base64',
            type: isMulti() ? 'multi' : isBbox() ? 'bbox' : 'grid'
        });
        const clicktime = Date.now().toString().slice(-3) / 2

        switch(data.status) {
            case 'solved':
            case 'new':
                if (isMulti()) {
                    clickMatchingElement(data.answer);
                } else if (isGrid()) {
                    const sfl = [...data?.solution].sort(() => Math.random() - 0.5);
                    for (const index of sfl) {
                        fireMouseEvents(cells[index])
                        await sleep(clicktime);
                    }
                } else if (isBbox()) {
                    if (data.answer?.length === 2) {
                        area(data.answer);
                    }
                }
                break;
            case 'skip':
            case 'falied':
                console.log(data.message);
                break;
            default:
                console.log('😨 Unknown status', data.status);
        }

        const ET = new Date() - startTime;
        const RT = (isMulti() ? cfg.hcaptime_multi : isBbox() ? cfg.hcaptime_bbox : cfg.hcaptime) * 1000 - ET

        await sleep(RT < 0 ? 300 : RT);

        fireMouseEvents(document.querySelector('.button-submit'));
        startTime = 0;
        stop = false;
    } catch (error) {
        console.warn(error);
    }
}
function area(res) {
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    fireMouseEvents(canvas, {
        clientX: res[0] + rect.left,
        clientY: res[1] + rect.top,
    })
}
function clickMatchingElement(res) {
    for (const e of res) {
        const ele = [...document.querySelectorAll('.answer-text')].find(el => el.outerText === e);
        fireMouseEvents(ele);
        // if (![...document.querySelectorAll('.answer-example')].some(el => el.style.backgroundColor === 'rgb(116, 116, 116)')) {
        //     fireMouseEvents(ele);
        // }
    }
}
function sliceOG() {
    const originalCanvas = document.querySelector('canvas');
    if (!originalCanvas) return null;

    const [originalWidth, originalHeight] = [
        originalCanvas.width,
        originalCanvas.height,
    ];

    const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
    const originalImageData = originalCtx.getImageData(0, 0, originalWidth, originalHeight);
    const allPixelsTransparentOrBlack = Array.from(originalImageData.data).every((value, index) => index % 4 === 3 || value === 0);

    if (allPixelsTransparentOrBlack) {
        console.error('The original canvas has no valid content');
        return null;
    }

    const desiredWidth = parseInt(originalCanvas.style.width, 10);
    const desiredHeight = parseInt(originalCanvas.style.height, 10);

    if (desiredWidth <= 0 || desiredHeight <= 0) {
        console.error('Desired width and height should be positive numbers');
        return null;
    }

    const scaleFactor = Math.min(desiredWidth / originalWidth, desiredHeight / originalHeight);
    const [outputWidth, outputHeight] = [
        originalWidth * scaleFactor,
        originalHeight * scaleFactor,
    ];

    const outputCanvas = document.createElement('canvas');
    Object.assign(outputCanvas, { width: outputWidth, height: outputHeight });

    const ctx = outputCanvas.getContext('2d');
    ctx.drawImage(originalCanvas, 0, 0, originalWidth, originalHeight, 0, 0, outputWidth, outputHeight);
    return outputCanvas.toDataURL('image/jpeg', 0.99).replace(/^data:image\/(png|jpeg);base64,/, '');
}
