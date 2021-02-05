const Discord = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const isImg = require('is-image-url');
const crypto = require('crypto');
const client = new Discord.Client();
const { token } = require('./config.json');
const { calculateAspectRatioFit, fragmentText } = require('./utils.js')

client.once('ready', () => {
    client.user.setPresence({ activity: { name: 'for a ping', type: "WATCHING" }, status: 'dnd' });
    console.log('Loaded!');
});

client.on('message', async message => {
    if (!message.content.includes('<@!806959867801108540>')) return;
    if (message.content === '<@!806959867801108540>' && !message.attachments.first()) return message.channel.send('__Options:__\n-u or --url\n-t or --top\n-b or --bottom\n--noupper');
    let args = message.content.match(/(?:[^\s"]+|"[^"]*")+/g);
    for (i in args) args[i] = args[i].replace(/"/g, '');
    let opts = {};
    if (args.includes('-u') || args.includes('--url')) {
        if (!message.attachments.first()) {
            let i = args.indexOf('-u') !== -1 ? args.indexOf('-u') : args.indexOf('--url');
            if (isImg(args[i + 1]) && i !== -1) opts.url = args[i + 1];
            else {
                message.react('🖼️');
                message.react('❌');
                return;
            }
        }
    }
    if (args.includes('--noupper')) {
        let i = args.indexOf('--noupper');
        if (i !== -1) opts.noupper = true;
    }
    if (args.includes('-t') || args.includes('--top')) {
        let i = args.indexOf('-t') !== -1 ? args.indexOf('-t') : args.indexOf('--top');
        if (i !== -1) {
            if (opts.noupper) opts.top = args[i + 1];
            else opts.top = args[i + 1].toUpperCase();
        }
    }
    if (args.includes('-b') || args.includes('--bottom')) {
        let i = args.indexOf('-b') !== -1 ? args.indexOf('-b') : args.indexOf('--bottom');
        if (i !== -1) {
            if (opts.noupper) opts.bottom = args[i + 1];
            else opts.bottom = args[i + 1].toUpperCase();
        }
    }
    if (!opts.top && !opts.bottom) {
        opts.top = "wtf bro define text";
        opts.bottom = "ping me for help";
    }
    if (!opts.url && !message.attachments.first()) {
        message.react('❌');
        message.react('🖼️');
        return;
    }
    if (message.attachments.first()) opts.url = message.attachments.first().url;
    loadImage(opts.url).then(async (image) => {
        let ratio = calculateAspectRatioFit(image.width, image.height, 512, 512)
        const canvas = createCanvas(ratio.width, ratio.height);
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0, ratio.width, ratio.height);
        let fontsize = image.width * 0.4;
        ctx.font = ctx.font = `bold ${fontsize}px Impact`;
        while ((ctx.measureText(opts.top).width > ctx.measureText(opts.bottom).width ? ctx.measureText(opts.top).width : ctx.measureText(opts.bottom).width) > Math.floor(canvas.width * 0.93)) {
            fontsize--;
            ctx.font = ctx.font = `bold ${fontsize}px Impact`;
            if (fragmentText(ctx.measureText(opts.top).width > ctx.measureText(opts.bottom).width ? opts.top : opts.bottom, Math.floor(canvas.width * 0.93), ctx).length < 3 && (ctx.measureText(opts.top).actualBoundingBoxAscent * 2 + ctx.measureText(opts.top).actualBoundingBoxDescent * 2 < canvas.height * 0.4) && (ctx.measureText(opts.bottom).actualBoundingBoxAscent * 2 + ctx.measureText(opts.bottom).actualBoundingBoxDescent * 2 < canvas.height * 0.4)) {
                if (ctx.measureText(opts.top).width > ctx.measureText(opts.bottom).width) opts.top = fragmentText(opts.top, Math.floor(canvas.width * 0.93), ctx).join('\n');
                else opts.bottom = fragmentText(opts.bottom, Math.floor(canvas.width * 0.93), ctx).join('\n');
                break;
            }
        }
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        if (opts.top) {
            ctx.fillText(opts.top, canvas.width / 2, ctx.measureText(opts.top).actualBoundingBoxAscent * 1.03);
            ctx.strokeText(opts.top, canvas.width / 2, ctx.measureText(opts.top).actualBoundingBoxAscent * 1.03);
        }
        if (opts.bottom) {
            ctx.fillText(opts.bottom, canvas.width / 2, canvas.height - ctx.measureText(opts.bottom).actualBoundingBoxDescent * 1.03);
            ctx.strokeText(opts.bottom, canvas.width / 2, canvas.height - ctx.measureText(opts.bottom).actualBoundingBoxDescent * 1.03);
        }
        message.channel.send(new Discord.MessageAttachment(canvas.toBuffer(), crypto.randomBytes(6).toString('hex') + '.png'))
    })
});

client.login(token);