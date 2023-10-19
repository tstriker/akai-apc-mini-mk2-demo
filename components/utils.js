
let utils = {
    noop: () => {},
    serverUrl(path) {
        // we're running on nginx if we're not on port 8085 anymore
        let nginx = document.location.port != "8085";
        let pathPrefix = path.startsWith("/api/") ? "" : "/api"; // make sure we don't double prefix our calls
        let apiRoot = nginx
            ? `${document.location.origin}${pathPrefix}`
            : `http://${document.location.hostname}:8080${pathPrefix}`;
        return apiRoot + path;
    },

    slug: str => (str || "").replace(/[^\w-]+/g, "-"),

    streamstick: () => navigator.userAgent.includes("TV Bro"),

    focusables: (container, traverse = true) => {
        // returns all keyboard navigable elements in the container
        function* elems(container) {
            // while it may be the 21st century, there is still no simple way to retrieve all the elements you see
            for (let elem of container.children) {
                let style = window.getComputedStyle(elem);
                if (style.display != "none" && style.visibility != "hidden" && !elem.disabled) {
                    if (
                        elem.matches("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])") &&
                        elem.tabIndex != "-1" &&
                        !elem.disabled
                    ) {
                        yield elem;
                    } else if (traverse) {
                        for (let nested of elems(elem)) {
                            yield nested;
                        }
                    }
                }
            }
        }

        return [...elems(container)];
    },

    mousify(event) {
        // mousify touch events by looking at the first touch data
        if ("TouchEvent" in window && event instanceof TouchEvent) {
            // TouchEvent not present in Safari
            return event.touches[0];
        } else {
            return event;
        }
    },

    exportCSV(data, category, headers) {
        let options = {
            showColumnHeaders: true,
            filename: `confirmed-${category}-${dt.datetime.now().strftime("%Y-%m-%d %H-%M-%S")}`,
            useBom: true,
        };

        if (!headers) {
            let allFields = new Set();
            data.forEach(row => {
                allFields = new Set([...allFields, ...Object.keys(row)]);
            });
            headers = [...allFields];
        }

        options.columnHeaders = headers.map(header => ({key: header, displayLabel: utils.capitalize(header)}));
        let csvConfig = ExportToCSV.mkConfig(options);
        let csv = ExportToCSV.generateCsv(csvConfig)(data);
        ExportToCSV.download(csvConfig)(csv);
    },

    randomID(existing) {
        let badLetters = ["0", "1", "o", "i", "l"];
        if (existing) {
            // if we are being given existing ids we can choose much shorter ids as we can check for collisions
            let id;
            while (!id || existing.includes(id) || badLetters.some(letter => id.includes(letter))) {
                id = new Number(Math.floor(Math.random() * parseInt("zzzz", 36))).toString(36);
            }
            return id;
        } else {
            // othewise prefer a long enough safe ID
            return new Number(Math.floor(Math.random() * parseInt("zzzzzzzzzzz", 36))).toString(36);
        }
    },

    selectRandom(options) {
        return options[Math.floor(Math.random() * options.length)];
    },

    scrollIn: (elem, offset = 0) => {
        let box = elem.getBoundingClientRect();

        let getScrollParent = node => {
            if (node === null) {
                return null;
            }

            if (node != elem && (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)) {
                return node;
            } else {
                return getScrollParent(node.parentNode);
            }
        };

        let parent = getScrollParent(elem);
        if (!parent) {
            return;
        }
        let parentBox = parent.getBoundingClientRect();

        let top = box.top - parentBox.top;
        let vertNudge = (parentBox.height - box.height) * (offset || 0);
        let scrollTop = parent.scrollTop;
        if (top - vertNudge < 0) {
            scrollTop = parent.scrollTop + top - vertNudge;
        } else if (top + box.height + vertNudge > parentBox.height) {
            scrollTop = parent.scrollTop + top + box.height - parentBox.height + vertNudge;
        }

        let left = box.left - parentBox.left;
        let horizNudge = box.width * (offset || 0);
        let scrollLeft = parent.scrollLeft;
        if (left < 0) {
            scrollLeft = parent.scrollLeft + left - horizNudge;
        } else if (left + box.width > parentBox.width) {
            scrollLeft = parent.scrollLeft + left + box.width - parentBox.width + horizNudge;
        }

        parent.scrollTo(scrollLeft, scrollTop);
    },

    animationFrame: callback => {
        // this little wrapper will skip any dropped frames
        let currentCallback = null;
        return () => {
            window.cancelAnimationFrame(currentCallback);
            currentCallback = window.requestAnimationFrame(callback);
        };
    },

    isNumber: str => /^-?\d+\.?\d*$/.exec(str) != null,

    round(val, precision) {
        let multiplier = Math.pow(10, precision || 0);
        return Math.round(val * multiplier) / multiplier;
    },

    toggleList(list, val) {
        if (list.includes(val)) {
            return list.filter(item => item != val);
        } else {
            return [...list, val];
        }
    },

    routeChange(component) {
        // on routeChange the matched component won't match the passed in component anymore
        return component.$.type.name != component.$route.matched[0]?.components.default.name;
    },

    sum(values, accessor) {
        accessor = accessor || (val => val);
        return values && values.length ? values.map(item => accessor(item)).reduce((total, cur) => total + cur) : 0;
    },

    sort(values, keyFunc, ascending = true) {
        // exercise in NIH because i don't wanna pull in lodash just for a basic sort

        // shallow clone
        values = [...(values || [])];

        // turn ascening from bool into a 1/-1 we can multiply with
        ascending = ascending ? 1 : -1;

        values.sort((a, b) => {
            let aVals = keyFunc ? keyFunc(a) : a;
            let bVals = keyFunc ? keyFunc(b) : b;
            aVals = aVals?.constructor.name == "Array" ? aVals : [aVals];
            bVals = bVals?.constructor.name == "Array" ? bVals : [bVals];

            for (let i = 0; i < aVals.length; i++) {
                if (aVals[i] < bVals[i]) {
                    return -ascending;
                } else if (aVals[i] > bVals[i]) {
                    return ascending;
                } else {
                    continue;
                }
            }
            return 0;
        });
        return values;
    },

    getDotField(obj, path) {
        let parts = path.split(".");
        let leaf = parts.splice(-1, 1)[0];
        let container = parts.reduce((prev, part) => prev[part], obj);
        return {container, containerPath: parts.join("."), leaf};
    },

    applyDotChanges(mainObj, changes) {
        Object.entries(changes).forEach(([path, val]) => {
            let operation = "update";
            if (path == "$delete") {
                // for deleting fields we do {'$delete' : 'path.to.field'}
                // so we need to swap the path and val around
                operation = "delete";
                path = val;
                if (Array.isArray(path)) {
                    path.forEach(p => {
                        this.applyDotChanges(mainObj, {$delete: p});
                    });
                    return;
                }
            } else if (path == "$push") {
                operation = "push";
                path = val.path;
            } else if (path == "$pop") {
                operation = "pop";
                path = val.path;
            }

            let {container, leaf} = this.getDotField(mainObj, path);

            if (operation == "delete") {
                delete container[leaf];
            } else if (operation == "push") {
                let pos = val.position != undefined ? val.position : container[leaf].length;
                container[leaf].splice(pos, 0, val.value);
            } else if (operation == "pop") {
                container[leaf].splice(val.position, 1);
            } else {
                try {
                    container[leaf] = val;
                } catch (error) {
                    console.warn(`Trying to set value for '${path}' but we don't have an object there`);
                    console.warn(error);
                }
            }
        });
    },

    logChanges(changes, groupMessage) {
        // insta-save
        console.groupCollapsed(
            `%c${groupMessage} (${JSON.stringify(changes).length} bytes)`,
            "color: 333; font-weight: normal; background: #eee; display: inline-block; padding: 3px 5px;"
        );
        Object.entries(changes).forEach(([key, val]) => {
            console.log(key, val);
        });
        console.groupEnd();
    },

    setPageTitle(title) {
        document.title = title ? `${title} - Showtime` : "Showtime";
    },

    getCSSVar(variable) {
        // returns CSS var defined in root, e.g. --content-horiz-padding
        return (getComputedStyle(document.querySelector("body")).getPropertyValue(`--${variable}`) || "").trim();
    },

    emailOk(email) {
        const re =
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },

    urlOk(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    },

    range(start, end, step) {
        if (end === undefined) {
            [start, end, step] = [0, start, 1];
        }

        step = Math.abs(step) || 1;
        if (end < start) {
            step = step * -1;
        }

        function* iterator() {
            for (let i = start; start < end ? i < end : i > end; i += step) {
                yield i;
            }
        }

        return [...iterator()];
    },

    shuffle(array) {
        // from bostock via stack overflow
        array = array || [];
        let m = array.length;
        let t;
        let i;

        // While there remain elements to shuffle…
        while (m) {
            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);

            // And swap it with the current element.
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    },

    random(start, end) {
        if (Array.isArray(start) || typeof start == "string") {
            // we've been given a list return end number of items from the list
            end = Math.min(Math.max(end || 1, 0), start.length);
            let items = utils.shuffle(start);
            return end > 1 ? items.slice(0, end) : items[0];
        } else if (!end) {
            return Math.round(Math.random() * start);
        } else {
            return start + Math.round(Math.random() * (end - start));
        }
    },

    parseTS(ts, utc) {
        if (typeof ts != "string") {
            return ts;
        }

        let formats = ["%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"];
        for (let i = 0; i < formats.length; i++) {
            try {
                // return first successful parse
                return dt.datetime.strptime(ts, formats[i], utc);
            } catch (error) {
                // pass
            }
        }
        // return the input if all else fails
        return ts;
    },

    parseDuration(duration) {
        // tries to parse mm:ss into seconds
        try {
            let [minutes, seconds] = duration.split(":");
            minutes = parseInt(minutes) || 0;
            seconds = parseInt(seconds) || 0;
            return minutes * 60 + seconds;
        } catch (error) {}
        return 0;
    },

    formatTS(ts, format) {
        ts = utils.parseTS(ts);
        return ts.strftime(format);
    },

    capitalize: label => (!label ? "" : `${label[0].toUpperCase()}${label.slice(1, label.length)}`),

    zeroPad: num => new String(parseInt(num)).padStart(2, "0"),

    formatDuration(seconds) {
        let negative = seconds < 0;
        seconds = Math.abs(seconds);
        return `${negative ? "-" : ""}${this.zeroPad(seconds / 60)}:${this.zeroPad(seconds % 60)}`;
    },

    humanDuration(seconds) {
        let negative = seconds < 0;
        seconds = Math.abs(seconds);
        return `${negative ? "-" : ""}${utils.pluralize(Math.floor(seconds / 60), "min", "mins")}${
            seconds % 60 ? ` ${utils.pluralize(seconds % 60, "sec", "secs")}` : ""
        }`;
    },

    addMonths(ts, months) {
        let time = {hour: ts.hour, minute: ts.minute};
        ts = dt.datetime.combine(ts, dt.time());
        utils.range(months).forEach(() => {
            if (months > 0) {
                ts = dt.datetime(ts + dt.timedelta(32));
            } else if (months < 0) {
                ts = dt.datetime(ts - dt.timedelta(1));
            }

            ts = ts.replace({day: 1, hour: time.hour, minute: time.minute});
        });

        return ts;
    },

    pluralize(n, singular, plural) {
        n = Array.isArray(n) ? n.length : n;
        return `${n} ${n == 1 ? singular : plural}`;
    },

    pluralizeNoun(n, singular, plural) {
        n = Array.isArray(n) ? n.length : n;
        return n == 1 ? singular : plural;
    },

    sanitize(obj) {
        // trim whitespace for now, maybe other insanity later
        // deep clone, to avoid side-effects
        obj = JSON.parse(JSON.stringify(obj));
        if (obj == null || typeof obj == "number") {
            return obj;
        } else if (Array.isArray(obj)) {
            obj.forEach((item, idx) => {
                obj[idx] = this.sanitize(item);
            });
            return obj;
        } else if (typeof obj == "string") {
            return obj.trim();
        } else {
            Object.entries(obj).forEach(([key, val]) => {
                obj[key] = this.sanitize(val);
            });
            return obj;
        }
    },

    humanDate(date) {
        let now = dt.datetime.now();
        if (now.year != date.year) {
            return date.strftime("%b %d, %Y");
        } else {
            return date.strftime("%b %d");
        }
    },

    humanTs(ts, timeFormat) {
        let now = dt.datetime.now();
        timeFormat = timeFormat || "%H:%M";
        ts = utils.parseTS(ts);

        if (now.year != ts.year) {
            return ts.strftime(`%b %d, %Y ${timeFormat}`);
        } else {
            return ts.strftime(`%b %d, ${timeFormat}`);
        }
    },

    timeSinceUTC(ts) {
        // returns approximate time since. i'm being real lazy right now because we use this only for tickets
        // this also doesn't support future times
        ts = utils.parseTS(ts, true);
        let now = dt.datetime(dt.datetime.utcnow());
        let minutes = dt.timedelta(now - ts).totalSeconds() / 60;
        if (minutes < 1) {
            return "just now";
        } else if (minutes < 120) {
            return `${utils.pluralize(Math.ceil(minutes), "minute", "minutes")} ago`;
        } else if (minutes < 60 * 36) {
            let hours = utils.round(minutes / 60, 1);
            return `${utils.pluralize(hours, "hour", "hours")} ago`;
        } else {
            let days = utils.round(minutes / 60 / 24, 1);
            return `${utils.pluralize(days, "day", "days")} ago`;
        }
    },

    gstore(path) {
        // return url for the path in gstore, doesn't care about trailing slashes
        path = path.replace(/^\//, "");
        return `https://storage.googleapis.com/show-assets/${path}`;
    },

    spotKey(spot) {
        return ["category", "role", "spot_length", "fee"]
            .map(field => (spot[field] || "").toString().trim().toLowerCase())
            .join("-");
    },

    isEmpty(obj) {
        return !obj || Object.keys(obj).length == 0;
    },

    toMoney(money, currency) {
        currency = currency || "";

        if (!utils.isNumber(money)) {
            // if we have currency in the number
            return money;
        } else {
            money = parseFloat(money);
        }

        if (!money) {
            return "-";
        }

        return currency.length <= 1
            ? `${currency}${utils.humanNumber(money)}`
            : `${currency} ${utils.humanNumber(money)}`;
    },

    parseMoney(money) {
        let moneyRe = /(?<currency>.*?)(?<money>[\d.,]+)(?<currency2>.*)/g;
        let parsed = moneyRe.exec(money);
        if (parsed?.groups) {
            let value = parseFloat(parsed.groups.money.replace(/,/g, "."));
            let currency = (parsed.groups.currency || "").trim() + (parsed.groups.currency2 || "").trim();
            if (currency.length <= 3 && !currency.includes("%")) {
                return {value, currency};
            }
        }
        return {value: null, currency: null};
    },

    humanNumber(val) {
        // https://stackoverflow.com/a/51322015/46617
        if (typeof val == "string") {
            val = parseFloat(val.replace(/,/, "")) || 0;
        }
        return val.toLocaleString();
    },

    toPercentStr(val, precision, relative) {
        val = val || 0;
        precision = precision == undefined ? 1 : precision;

        if (val == Infinity || val == NaN) {
            return "-";
        } else if (val > 2) {
            return `${Number(val).toFixed(1)}x`;
        } else {
            let res = Number(val * 100);
            if (relative) {
                // when relative is specified, drops the hundred, so
                // 108% becomes "8% more" and 94% becomes "6% less"
                // the more/less has to figured out outside of this
                res = Math.abs(res - 100);
            }
            return res.toFixed(precision) + "%";
        }
    },

    listify(val) {
        return Array.isArray(val) ? val : [val];
    },

    stripThe(name) {
        // removes "the " from prefix so we can normalize and not have to consider the the's
        name = (name || "").trim();
        return name.toLowerCase().startsWith("the ") ? name.slice(4) : name;
    },

    singleSpace(str) {
        return str.replace(/\s+/g, " ").trim();
    },

    spotLengths: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(minutes => ({
        label: minutes == 0 ? "Full Show" : `${minutes} mins`,
        value: minutes,
    })),

    getLabel: (name, group) => (group ? labels[group][name] : labels[name]) || name,

    replaceAll: (str, pattern, replacement) => {
        return str.replace(new RegExp(pattern, "g"), replacement);
    },

    setDefault(obj, key, defaultVal) {
        obj[key] = obj[key] || defaultVal;
        return obj[key];
    },

    filters: {
        capitalize: label => utils.capitalize(label),
        round: (val, precision) => utils.round(val, precision),
        imgUrl: (hash, size) => utils.imgUrl(hash, size),
        formatVariantID: (product, variantID) => utils.formatVariantID(product, variantID),
        getLabel: (group, labelId, defaultVal) => utils.getLabel(group, labelId, defaultVal),
        range: (start, end, step) => utils.range(start, end, step),
        parseDate: ts => utils.parseTS(ts),
        formatTS: (ts, format) => utils.formatTS(ts, format),
        personalizeScore: (score, values) => utils.personalizeScore(score, values),
        humanNumber: x => utils.humanNumber(x),
        toPercentStr: (val, precision, relative) => utils.toPercentStr(val, precision, relative),
        humanDate: date => utils.humanDate(date),
        humanTs: (ts, timeFormat) => utils.humanTs(ts, timeFormat),
        emailOk: email => utils.emailOk(email),
        urlOk: url => utils.urlOk(url),
        addMonths: (ts, months) => utils.addMonths(ts, months),
        toggleList: (list, val) => utils.toggleList(list, val),
        pluralize: (n, singular, plural) => utils.pluralize(n, singular, plural),
        pluralizeNoun: (n, singular, plural) => utils.pluralizeNoun(n, singular, plural),
        sort: (list, func) => utils.sort(list, func),
        gstore: path => utils.gstore(path),
        slotDescriptor: (slot, currency) => utils.slotDescriptor(slot, currency),
        formatDuration: seconds => utils.formatDuration(seconds),
        humanDuration: seconds => utils.humanDuration(seconds),
        isEmpty: obj => utils.isEmpty(obj),
        toMoney: (money, currency) => utils.toMoney(money, currency),
        timeSinceUTC: ts => utils.timeSinceUTC(ts),
        stripThe: name => utils.stripThe(name),
        getLabel: (name, group) => utils.getLabel(name, group),
        zeroPad: num => utils.zeroPad(num),
    },

    addEventListener(watcher, type, listener) {
        // Bug with Safari re MediaQueryList not inheriting addEventListener
        // https://github.com/mdn/sprints/issues/858#issuecomment-537992077
        if (watcher.addEventListener) {
            watcher.addEventListener(type, listener);
        } else if (watcher.addListener) {
            watcher.addListener(listener);
        }
    },
    removeEventListener(watcher, type, listener) {
        // Bug with Safari re MediaQueryList not inheriting removeEventListener
        // https://github.com/mdn/sprints/issues/858#issuecomment-537992077
        if (watcher.removeEventListener) {
            watcher.removeEventListener(type, listener);
        } else if (watcher.removeListener) {
            watcher.removeListener(listener);
        }
    },

    importToComp(components) {
        // converts results of eagerGlob to actually usable components
        return Object.fromEntries(
            Object.entries(components).map(([key, comp]) => {
                let componentName = key.split("/").slice(-1)[0].split(".")[0];
                return [componentName, comp.default || comp];
            })
        );
    },

    parseDateRange(str) {
        // in order to count all dates need to parse. would be good to not be too jumpy, so maybe validate on exit
        let today = dt.datetime.combine(dt.datetime.now().date(), dt.time());
        let reg =
            /(?<month>(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))?\s*(?<rangeMarker>[,-])?\s*(?<day>\d{1,2})?\s*/gi;

        let curMo;
        let curDay;
        let rangeMarker;
        let res = [];

        let matches = [...str.matchAll(reg)].map(res => res.groups);
        matches.forEach(match => {
            if (match.month) {
                curDay = null;
                curMo = dt.datetime.strptime(`${match.month}-${today.year}`, "%b-%Y");
                if (curMo.month < today.month) {
                    // if the month is in the past, push it forward by a year
                    curMo = dt.datetime(curMo + dt.timedelta({days: 365}));
                }
            }

            if (match.rangeMarker) {
                rangeMarker = match.rangeMarker;
            }

            if (match.day && curMo) {
                let day = parseInt(match.day);
                if (day >= 1 && day <= 31) {
                    if (!curDay || (rangeMarker != "-" && day > curDay)) {
                        res.push(dt.datetime(curMo.year, curMo.month, parseInt(match.day)));
                    } else if (curDay && rangeMarker == "-") {
                        let until = parseInt(match.day);
                        if (until > curDay) {
                            utils.range(curDay + 1, until + 1).forEach(day => {
                                res.push(dt.datetime(curMo.year, curMo.month, day));
                            });
                        }
                    }

                    curDay = parseInt(match.day);
                }
                rangeMarker = null;
            }
        });

        return res;
    },

    async inlineIcon(name, filled) {
        // for localhost development only since in prod we have a single static file
        this._knownIcons = this._knownIcons || {};
        let id = `${name}-${filled}`;
        if (this._knownIcons[id]) {
            return;
        }
        this._knownIcons[id] = true;

        let path = `/material-icons/${name}/${filled ? "baseline" : "outline"}.svg`;
        let data = await fetch(path);
        let svg = await data.text();
        if (!svg) {
            return;
        }
        let contentsRe = /<svg[^>]*>(?<contents>(.)*)<\/svg>/;
        let contents = contentsRe.exec(svg)?.groups.contents;

        let symbol = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
        symbol.setAttribute("id", `icon-${name}${filled ? "-filled" : ""}`);
        symbol.setAttribute("viewBox", "0 0 24 24");
        symbol.innerHTML = contents;

        if (!this._iconContainer) {
            this._iconContainer = document.createElement("svg");
            this._iconContainer.style["display"] = "none";
            document.body.append(this._iconContainer);
        }
        this._iconContainer.appendChild(symbol);
    },

    async sleep(seconds) {
        return new Promise(resolve => {
            setTimeout(resolve, seconds * 1000);
        });
    },

    isTouch() {
        return "ontouchstart" in window;
    },

    slotDescriptor(slot, currency) {
        let spotLength = parseInt(slot.spot_length || "");
        let descriptor;

        if (slot.role && slot.role.includes(spotLength)) {
            descriptor = slot.role;
        } else if (slot.category != "act" && !slot.spot_length) {
            descriptor = slot.role || utils.capitalize(slot.category);
        } else if (slot.role && slot.role.toLowerCase().trim() != "act") {
            // we need to handle user hardcoded 'act' role because i dunno why but people like typing that in
            // and if it's just your basic act, we want the spot length (executed in the next else)
            // this code is messy. i need to think about it
            // for non-act roles the information that it is full show is irrelevant. but is relevant when length is specific
            descriptor = `${slot.role}${spotLength ? ` (${spotLength})` : ""}`;
        } else {
            descriptor = `${utils.capitalize(slot.category)} ${spotLength ? `(${spotLength})` : "(full show)"}`;
        }

        if (currency !== undefined && slot.fee) {
            descriptor = `${descriptor}, fee: ${utils.toMoney(slot.fee, currency)}`;
        }

        return descriptor;
    },

    sortSlots(slots) {
        let catOrder = {host: 1, act: 2, break: 2, production: 3, other: 4};
        slots = !Array.isArray(slots) ? Object.values(slots) : slots;
        return utils.sort(slots, slot => [catOrder[slot.category] || 99, slot.order]);
    },

    adjustedDate(ts) {
        let date = dt.datetime.combine(ts, dt.time(5));
        if (ts.hour < 5) {
            date = dt.datetime(date - dt.timedelta({days: 1}));
        }
        return date;
    },

    prefixChanges(changes, path) {
        let res = {};
        if (path) {
            Object.entries(changes).forEach(([field, val]) => {
                if (field == "$delete") {
                    res[field] = `${path}.${val}`;
                } else if (field == "$push") {
                    res[field] = {...val, path: `${path}.${val.path}`};
                } else if (field == "$pop") {
                    res[field] = {...val, path: `${path}.${val.path}`};
                } else {
                    res[`${path}.${field}`] = val;
                }
            });
        } else {
            res = changes;
        }
        return res;
    },
};

export default utils;
