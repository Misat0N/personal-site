const localeLabels = { zh: "简体中文", en: "English", ja: "日本語" };
const sectionKeys = [
  ["about", "关于"],
  ["focus", "关注方向"],
  ["education", "教育"],
  ["experience", "经历"],
  ["work", "研究与项目"],
  ["awards", "获奖"],
  ["skills", "技能"],
  ["exchange", "海外交流"],
  ["contact", "联系"],
  ["materials", "待确认内容"],
];

let locale = new URLSearchParams(location.search).get("locale") || "zh";
if (!localeLabels[locale]) locale = "zh";
let revision = 0;
let generation = 0;
let content = null;
let dirty = false;
let mode = "form";
let fieldSerial = 0;
let loadSequence = 0;
let loadController = null;
let saving = false;
let versionSequence = 0;
let releaseSequence = 0;
let releaseMutation = false;
let generationLoaded = false;
let draftHeads = null;

const form = document.querySelector("#content-form");
const structuredEditor = document.querySelector("#structured-editor");
const jsonPanel = document.querySelector("#json-panel");
const editor = document.querySelector("#content-editor");
const message = document.querySelector("#message");
const statusNode = document.querySelector("#status");
const dirtyNode = document.querySelector("#dirty-indicator");
const revisionNode = document.querySelector("#revision");
const generationNode = document.querySelector("#generation");
const localeLabel = document.querySelector("#locale-label");
const previewLink = document.querySelector("#preview-link");
const saveButton = document.querySelector("#save-button");
const reloadButton = document.querySelector("#reload-button");
const publishButton = document.querySelector("#publish-button");
const formModeButton = document.querySelector("#form-mode-button");
const jsonModeButton = document.querySelector("#json-mode-button");

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setMessage(text, type = "info") {
  message.textContent = text;
  message.dataset.type = type;
}

function setDirty(next = true) {
  dirty = next;
  dirtyNode.textContent = dirty ? "是 — 尚未保存" : "否";
  dirtyNode.dataset.dirty = String(dirty);
  document.title = `${dirty ? "● " : ""}Personal Site CMS`;
}

function markDirty() {
  setDirty(true);
  if (statusNode.textContent !== "正在保存") statusNode.textContent = "编辑中";
}

async function request(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.data = data;
    error.status = response.status;
    throw error;
  }
  return data;
}

function updateLocaleUi() {
  document.querySelectorAll("[data-locale]").forEach((button) => {
    const selected = button.dataset.locale === locale;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  localeLabel.textContent = localeLabels[locale];
  previewLink.href = `/admin/preview/${locale}/`;
  history.replaceState(null, "", `/admin/?locale=${locale}`);
}

function clearValidationErrors() {
  structuredEditor.querySelectorAll("[aria-invalid='true']").forEach((node) => {
    node.removeAttribute("aria-invalid");
    const helpId = node.dataset.helpId;
    if (helpId) node.setAttribute("aria-describedby", helpId);
    else node.removeAttribute("aria-describedby");
  });
  structuredEditor.querySelectorAll(".field-error").forEach((node) => node.remove());
}

function openAncestors(node) {
  let details = node.closest?.("details");
  while (details) {
    details.open = true;
    details = details.parentElement?.closest("details");
  }
}

function showValidationIssues(issues) {
  clearValidationErrors();
  if (!Array.isArray(issues) || issues.length === 0) return;
  let firstControl = null;
  const lines = [];
  issues.forEach((issue, index) => {
    const rawPath = Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path || "content");
    const path = rawPath.startsWith("content.") ? rawPath.slice(8) : rawPath;
    const text = issue.message || "内容不符合要求";
    lines.push(`${path}: ${text}`);
    const controls = Array.from(structuredEditor.querySelectorAll("[data-path]"));
    const control = controls.find((item) => item.dataset.path === path)
      || controls.find((item) => path.startsWith(`${item.dataset.path}.`))
      || controls.find((item) => item.dataset.path.startsWith(`${path}.`));
    if (!control) return;
    control.setAttribute("aria-invalid", "true");
    const errorNode = element("span", "field-error", text);
    errorNode.id = `field-error-${index + 1}`;
    const describedBy = [control.dataset.helpId, errorNode.id].filter(Boolean).join(" " );
    control.setAttribute("aria-describedby", describedBy);
    const errorHost = control.closest(".form-field") || control.closest(".repeater") || control.parentElement;
    errorHost?.append(errorNode);
    openAncestors(control);
    firstControl ||= control;
  });
  setMessage(`请检查以下字段：\n${lines.join("\n")}`, "error");
  firstControl?.focus();
}

function collectOpenDetails() {
  return new Set(Array.from(structuredEditor.querySelectorAll("details[open][id]"), (node) => node.id));
}

function focusPath(path) {
  if (!path) return;
  requestAnimationFrame(() => {
    const target = Array.from(structuredEditor.querySelectorAll("[data-path]"))
      .find((node) => node.dataset.path === path);
    if (!target) return;
    openAncestors(target);
    target.focus();
  });
}

function rerender(path, extraOpenId) {
  const openIds = collectOpenDetails();
  if (extraOpenId) openIds.add(extraOpenId);
  renderStructured(openIds);
  focusPath(path);
}

function setOptional(target, key, value) {
  if (value === "") delete target[key];
  else target[key] = value;
}

function createField(parent, options) {
  const wrapper = element("div", `form-field${options.wide ? " form-field--wide" : ""}`);
  const id = `field-${++fieldSerial}`;
  const label = element("label", "field-label", options.label);
  label.htmlFor = id;

  const control = document.createElement(options.multiline ? "textarea" : "input");
  control.id = id;
  control.dataset.path = options.path;
  control.value = options.value ?? "";
  if (!options.multiline) control.type = options.type || "text";
  if (options.multiline) control.rows = options.rows || 4;
  if (options.maxLength) control.maxLength = options.maxLength;
  if (options.required) control.required = true;
  if (options.pattern) control.pattern = options.pattern;
  if (options.placeholder) control.placeholder = options.placeholder;
  if (options.inputMode) control.inputMode = options.inputMode;
  if (options.autocomplete) control.autocomplete = options.autocomplete;

  let help;
  if (options.help) {
    help = element("span", "field-help", options.help);
    help.id = `${id}-help`;
    control.dataset.helpId = help.id;
    control.setAttribute("aria-describedby", help.id);
  }
  control.addEventListener("input", () => {
    options.set(control.value);
    control.removeAttribute("aria-invalid");
    wrapper.querySelector(".field-error")?.remove();
    markDirty();
  });
  if (options.maxLength) {
    const counter = element("span", "field-counter");
    const updateCounter = () => { counter.textContent = `${control.value.length} / ${options.maxLength}`; };
    updateCounter();
    control.addEventListener("input", updateCounter);
    wrapper.append(label, control, counter);
  } else {
    wrapper.append(label, control);
  }
  if (help) wrapper.append(help);
  parent.append(wrapper);
  return control;
}

function createCheckbox(parent, options) {
  const wrapper = element("div", `form-field form-field--wide checkbox-field${options.warning ? " checkbox-field--warning" : ""}`);
  const label = element("label", "checkbox-label");
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(options.value);
  input.dataset.path = options.path;
  const copy = element("span");
  copy.append(element("strong", "", options.label));
  if (options.help) copy.append(element("small", "", options.help));
  label.append(input, copy);
  input.addEventListener("change", () => {
    options.set(input.checked);
    markDirty();
    options.afterChange?.(input.checked);
  });
  wrapper.append(label);
  parent.append(wrapper);
  return input;
}

function createFieldset(parent, title, description) {
  const fieldset = element("fieldset", "field-group");
  fieldset.append(element("legend", "group-title", title));
  if (description) fieldset.append(element("p", "group-description", description));
  const grid = element("div", "field-grid");
  fieldset.append(grid);
  parent.append(fieldset);
  return grid;
}

function createSection(id, eyebrow, title, description, openIds, defaultOpen = false) {
  const details = element("details", "form-section");
  details.id = id;
  details.open = openIds.has(id) || (openIds.size === 0 && defaultOpen);
  const summary = document.createElement("summary");
  const copy = element("span", "section-summary__copy");
  copy.append(element("small", "", eyebrow), element("strong", "", title));
  if (description) copy.append(element("span", "", description));
  summary.append(copy, element("span", "section-summary__icon", "＋"));
  const body = element("div", "form-section__body");
  details.append(summary, body);
  structuredEditor.append(details);
  return body;
}

function actionButton(label, title, onClick, className = "icon-button") {
  const button = element("button", className, label);
  button.type = "button";
  button.title = title;
  button.setAttribute("aria-label", title);
  button.addEventListener("click", onClick);
  return button;
}

function confirmRemoval(label, hasContent) {
  return !hasContent || window.confirm(`确认删除“${label}”？此操作会在当前表单中立即移除，保存前仍可重新载入恢复。`);
}

function renderStringArray(parent, options) {
  const block = element("div", `repeater repeater--scalar${options.wide ? " form-field--wide" : ""}`);
  const header = element("div", "repeater-header");
  const heading = element("div");
  heading.append(element("strong", "", options.title));
  if (options.help) heading.append(element("p", "", options.help));
  const add = element("button", "add-button", `＋ 新增${options.itemLabel}`);
  add.type = "button";
  add.dataset.path = options.path;
  add.disabled = options.items.length >= options.max;
  add.addEventListener("click", () => {
    if (options.items.length >= options.max) return;
    options.items.push("");
    markDirty();
    rerender(`${options.path}.${options.items.length - 1}`);
  });
  header.append(heading, add);
  block.append(header);

  const list = element("div", "scalar-list");
  if (options.items.length === 0) list.append(element("p", "empty-state", `暂无${options.itemLabel}。`));
  options.items.forEach((value, index) => {
    const row = element("div", "scalar-row");
    const path = `${options.path}.${index}`;
    const fieldHost = element("div", "scalar-row__field");
    createField(fieldHost, {
      label: `${options.itemLabel} ${index + 1}`,
      value,
      path,
      multiline: options.multiline,
      rows: options.rows || 2,
      maxLength: options.maxLength || 500,
      placeholder: options.placeholder,
      set: (next) => { options.items[index] = next; },
    });
    const actions = element("div", "item-actions");
    const up = actionButton("↑", `${options.itemLabel} ${index + 1} 上移`, () => {
      if (index === 0) return;
      [options.items[index - 1], options.items[index]] = [options.items[index], options.items[index - 1]];
      markDirty();
      rerender(`${options.path}.${index - 1}`);
    });
    up.disabled = index === 0;
    const down = actionButton("↓", `${options.itemLabel} ${index + 1} 下移`, () => {
      if (index === options.items.length - 1) return;
      [options.items[index + 1], options.items[index]] = [options.items[index], options.items[index + 1]];
      markDirty();
      rerender(`${options.path}.${index + 1}`);
    });
    down.disabled = index === options.items.length - 1;
    const remove = actionButton("删除", `删除${options.itemLabel} ${index + 1}`, () => {
      if (options.items.length <= (options.min || 0)) return;
      if (!confirmRemoval(`${options.itemLabel} ${index + 1}`, Boolean(String(value).trim()))) return;
      options.items.splice(index, 1);
      markDirty();
      rerender(options.items.length ? `${options.path}.${Math.min(index, options.items.length - 1)}` : options.path);
    }, "text-button text-button--danger");
    remove.disabled = options.items.length <= (options.min || 0);
    actions.append(up, down, remove);
    row.append(fieldHost, actions);
    list.append(row);
  });
  block.append(list);
  parent.append(block);
}

function renderObjectArray(parent, options) {
  const block = element("div", "repeater repeater--objects");
  const header = element("div", "repeater-header");
  const heading = element("div");
  heading.append(element("strong", "", options.title));
  if (options.help) heading.append(element("p", "", options.help));
  const add = element("button", "add-button", `＋ 新增${options.itemLabel}`);
  add.type = "button";
  add.dataset.path = options.path;
  add.disabled = options.items.length >= options.max;
  add.addEventListener("click", () => {
    if (options.items.length >= options.max) return;
    const index = options.items.length;
    options.items.push(options.create(index));
    options.afterAdd?.(options.items);
    markDirty();
    rerender(`${options.path}.${index}.${options.firstKey}`, `${options.sectionId}-item-${index}`);
  });
  header.append(heading, add);
  block.append(header);

  const list = element("div", "object-list");
  if (options.items.length === 0) list.append(element("p", "empty-state", `暂无${options.itemLabel}，可以从这里新增。`));
  options.items.forEach((item, index) => {
    const itemDetails = element("details", "repeater-item");
    itemDetails.id = `${options.sectionId}-item-${index}`;
    itemDetails.open = options.openIds.has(itemDetails.id);
    const summary = document.createElement("summary");
    summary.append(
      element("span", "item-number", String(index + 1).padStart(2, "0")),
      element("strong", "item-title", options.label(item, index)),
      element("span", "item-toggle", "展开"),
    );
    const body = element("div", "repeater-item__body");
    const toolbar = element("div", "item-toolbar");
    const up = actionButton("↑ 上移", `${options.itemLabel} ${index + 1} 上移`, () => {
      if (index === 0) return;
      [options.items[index - 1], options.items[index]] = [options.items[index], options.items[index - 1]];
      markDirty();
      rerender(`${options.path}.${index - 1}.${options.firstKey}`, `${options.sectionId}-item-${index - 1}`);
    }, "text-button");
    up.disabled = index === 0;
    const down = actionButton("↓ 下移", `${options.itemLabel} ${index + 1} 下移`, () => {
      if (index === options.items.length - 1) return;
      [options.items[index + 1], options.items[index]] = [options.items[index], options.items[index + 1]];
      markDirty();
      rerender(`${options.path}.${index + 1}.${options.firstKey}`, `${options.sectionId}-item-${index + 1}`);
    }, "text-button");
    down.disabled = index === options.items.length - 1;
    const remove = actionButton("删除此项", `删除${options.itemLabel} ${index + 1}`, () => {
      if (!confirmRemoval(options.label(item, index), true)) return;
      options.items.splice(index, 1);
      options.afterRemove?.(options.items);
      markDirty();
      rerender(options.items.length ? `${options.path}.${Math.min(index, options.items.length - 1)}.${options.firstKey}` : options.path);
    }, "text-button text-button--danger");
    toolbar.append(up, down, remove);
    const fieldset = document.createElement("fieldset");
    fieldset.className = "repeater-fields";
    const legend = element("legend", "sr-only", `${options.itemLabel} ${index + 1}`);
    const grid = element("div", "field-grid");
    fieldset.append(legend, grid);
    options.render(grid, item, index, `${options.path}.${index}`);
    body.append(toolbar, fieldset);
    itemDetails.append(summary, body);
    list.append(itemDetails);
  });
  block.append(list);
  parent.append(block);
}

function nextResumeId(prefix, items) {
  const used = new Set(items.map((item) => item.id));
  let index = items.length + 1;
  while (used.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

function emptyResume(prefix, items) {
  return {
    id: nextResumeId(prefix, items),
    kicker: "",
    title: "",
    period: "",
    summary: "",
    highlights: [],
    tags: [],
  };
}

function renderResumeFields(grid, item, _index, path, openIds) {
  createField(grid, {
    label: "稳定标识 ID", value: item.id, path: `${path}.id`, required: true, maxLength: 120,
    pattern: "[a-z0-9-]+", help: "仅小写字母、数字和连字符；跨语言对应条目建议使用相同 ID。",
    set: (value) => { item.id = value; },
  });
  createField(grid, { label: "类型 / 眉题", value: item.kicker, path: `${path}.kicker`, maxLength: 500, set: (value) => { item.kicker = value; } });
  createField(grid, { label: "标题", value: item.title, path: `${path}.title`, maxLength: 500, set: (value) => { item.title = value; } });
  createField(grid, { label: "副标题（可选）", value: item.subtitle, path: `${path}.subtitle`, maxLength: 500, set: (value) => setOptional(item, "subtitle", value) });
  createField(grid, { label: "时间", value: item.period, path: `${path}.period`, maxLength: 500, placeholder: "2025.01 — 至今", set: (value) => { item.period = value; } });
  createField(grid, { label: "状态（可选）", value: item.status, path: `${path}.status`, maxLength: 500, placeholder: "Ongoing / Completed", set: (value) => setOptional(item, "status", value) });
  createField(grid, { label: "简介", value: item.summary, path: `${path}.summary`, multiline: true, rows: 4, maxLength: 12000, wide: true, set: (value) => { item.summary = value; } });
  renderStringArray(grid, { title: "要点", itemLabel: "要点", items: item.highlights, path: `${path}.highlights`, max: 32, multiline: true, rows: 2, maxLength: 12000, wide: true });
  renderStringArray(grid, { title: "标签", itemLabel: "标签", items: item.tags, path: `${path}.tags`, max: 64, maxLength: 500, wide: true });

  createCheckbox(grid, {
    label: "启用论文 / 项目媒体",
    help: "为当前条目添加图片、图注、来源及可选许可证；关闭后将删除整组媒体信息。",
    value: Boolean(item.media),
    path: `${path}.media`,
    set: (value) => {
      if (value) item.media = { src: "", alt: "", caption: "", source: { label: "", href: "" } };
      else delete item.media;
    },
    afterChange: () => rerender(item.media ? `${path}.media.src` : `${path}.media`),
  });
  if (item.media) {
    createField(grid, {
      label: "媒体地址", value: item.media.src, path: `${path}.media.src`, maxLength: 2000, inputMode: "url",
      placeholder: "/images/project.webp 或 https://…", help: "支持 http(s) 或以单斜杠开头的站内地址。",
      set: (value) => { item.media.src = value; },
    });
    createField(grid, {
      label: "媒体替代文本", value: item.media.alt, path: `${path}.media.alt`, maxLength: 500,
      help: "简要描述图片内容；纯装饰图片可以留空。", set: (value) => { item.media.alt = value; },
    });
    createField(grid, {
      label: "媒体图注", value: item.media.caption, path: `${path}.media.caption`, multiline: true, rows: 3, maxLength: 12000, wide: true,
      set: (value) => { item.media.caption = value; },
    });
    createField(grid, {
      label: "来源名称", value: item.media.source.label, path: `${path}.media.source.label`, maxLength: 500,
      placeholder: "论文、数据集或图片作者", set: (value) => { item.media.source.label = value; },
    });
    createField(grid, {
      label: "来源地址", value: item.media.source.href, path: `${path}.media.source.href`, maxLength: 2000, inputMode: "url",
      placeholder: "https://… 或 /站内路径", set: (value) => { item.media.source.href = value; },
    });
    createCheckbox(grid, {
      label: "提供媒体许可证",
      help: "如 CC BY 4.0；关闭后将删除许可证名称与地址。",
      value: Boolean(item.media.license),
      path: `${path}.media.license`,
      set: (value) => {
        if (value) item.media.license = { label: "", href: "" };
        else delete item.media.license;
      },
      afterChange: () => rerender(item.media?.license ? `${path}.media.license.label` : `${path}.media.license`),
    });
    if (item.media.license) {
      createField(grid, {
        label: "许可证名称", value: item.media.license.label, path: `${path}.media.license.label`, maxLength: 500,
        placeholder: "CC BY 4.0", set: (value) => { item.media.license.label = value; },
      });
      createField(grid, {
        label: "许可证地址", value: item.media.license.href, path: `${path}.media.license.href`, maxLength: 2000, inputMode: "url",
        placeholder: "https://… 或 /站内路径", set: (value) => { item.media.license.href = value; },
      });
    }
  }

  const links = Array.isArray(item.links) ? item.links : [];
  renderObjectArray(grid, {
    title: "外部链接（可选）",
    help: "论文全文、代码仓库、演示站点等；顺序即前台显示顺序。",
    itemLabel: "外部链接",
    items: links,
    path: `${path}.links`,
    max: 16,
    sectionId: `resume-links-${path.replace(/[^a-z0-9-]+/gi, "-")}`,
    openIds,
    firstKey: "label",
    create: () => ({ label: "", href: "" }),
    label: (link, index) => link.label || `外部链接 ${index + 1}`,
    afterAdd: (nextLinks) => { item.links = nextLinks; },
    afterRemove: (nextLinks) => { if (nextLinks.length === 0) delete item.links; },
    render: (host, link, _linkIndex, linkPath) => {
      createField(host, { label: "链接名称", value: link.label, path: `${linkPath}.label`, maxLength: 500, set: (value) => { link.label = value; } });
      createField(host, {
        label: "链接地址", value: link.href, path: `${linkPath}.href`, maxLength: 2000, inputMode: "url",
        placeholder: "https://…、mailto:… 或 /站内路径", set: (value) => { link.href = value; },
      });
    },
  });
}

function renderResumeSection(body, options, openIds) {
  renderObjectArray(body, {
    title: options.title,
    help: options.help,
    itemLabel: options.itemLabel,
    items: options.items,
    path: options.path,
    max: options.max,
    sectionId: options.sectionId,
    openIds,
    firstKey: "id",
    create: () => emptyResume(options.prefix, options.items),
    label: (item, index) => item.title || `${options.itemLabel} ${index + 1}`,
    render: (grid, item, index, path) => renderResumeFields(grid, item, index, path, openIds),
  });
}

function renderStructured(openIds = new Set()) {
  if (!content) return;
  fieldSerial = 0;
  structuredEditor.replaceChildren();
  structuredEditor.setAttribute("aria-busy", "false");

  let body = createSection("section-site", "01 · Site & Hero", "站点、Hero 与简介", "SEO、身份信息、首页首屏、简介与头像。", openIds, true);
  let grid = createFieldset(body, "发布显示", "草稿开关会改变公开页面的索引状态和提示内容。");
  createCheckbox(grid, {
    label: "启用前台草稿标记",
    help: "开启后正式页面会显示草稿横幅并阻止搜索引擎收录；发布前请特别确认。",
    value: content.draftMode, path: "draftMode", warning: true,
    set: (value) => { content.draftMode = value; },
  });

  grid = createFieldset(body, "SEO");
  createField(grid, { label: "页面标题", value: content.seo.title, path: "seo.title", maxLength: 500, wide: true, set: (value) => { content.seo.title = value; } });
  createField(grid, { label: "页面描述", value: content.seo.description, path: "seo.description", multiline: true, rows: 3, maxLength: 12000, wide: true, set: (value) => { content.seo.description = value; } });

  grid = createFieldset(body, "身份与 Hero");
  createField(grid, { label: "姓名", value: content.name, path: "name", maxLength: 500, set: (value) => { content.name = value; } });
  createField(grid, { label: "罗马字 / 另一语言姓名", value: content.romanizedName, path: "romanizedName", maxLength: 500, set: (value) => { content.romanizedName = value; } });
  createField(grid, { label: "姓名缩写", value: content.initials, path: "initials", required: true, maxLength: 10, help: "必填，最多 10 个字符。", set: (value) => { content.initials = value; } });
  createField(grid, { label: "Hero 眉题", value: content.eyebrow, path: "eyebrow", maxLength: 500, set: (value) => { content.eyebrow = value; } });
  renderStringArray(grid, { title: "Hero 标题行", help: "至少 1 行，最多 5 行；顺序即首页显示顺序。", itemLabel: "标题行", items: content.headlineLines, path: "headlineLines", min: 1, max: 5, maxLength: 500, wide: true });
  createField(grid, { label: "Hero 引言", value: content.introduction, path: "introduction", multiline: true, rows: 3, maxLength: 12000, wide: true, set: (value) => { content.introduction = value; } });
  createField(grid, { label: "当前状态", value: content.availability, path: "availability", maxLength: 500, wide: true, set: (value) => { content.availability = value; } });

  grid = createFieldset(body, "个人简介与事实");
  createField(grid, { label: "个人简介", value: content.about, path: "about", multiline: true, rows: 6, maxLength: 12000, wide: true, set: (value) => { content.about = value; } });
  renderObjectArray(grid, {
    title: "事实卡片", itemLabel: "事实", items: content.facts, path: "facts", max: 20, sectionId: "facts", openIds, firstKey: "label",
    create: () => ({ label: "", value: "" }), label: (item, index) => item.label || `事实 ${index + 1}`,
    render: (host, item, _index, path) => {
      createField(host, { label: "标签", value: item.label, path: `${path}.label`, maxLength: 500, set: (value) => { item.label = value; } });
      createField(host, { label: "内容", value: item.value, path: `${path}.value`, multiline: true, rows: 2, maxLength: 12000, set: (value) => { item.value = value; } });
    },
  });

  grid = createFieldset(body, "头像（可选）", "不启用时会从保存内容中省略整个 portrait 对象。");
  createCheckbox(grid, {
    label: "显示头像", help: "启用后请填写站内路径，或 http(s) 图片地址。",
    value: Boolean(content.portrait), path: "portrait",
    set: (value) => {
      if (value) content.portrait = { src: "", alt: "" };
      else delete content.portrait;
    },
    afterChange: () => rerender(content.portrait ? "portrait.src" : "portrait"),
  });
  if (content.portrait) {
    createField(grid, { label: "图片地址", value: content.portrait.src, path: "portrait.src", maxLength: 2000, inputMode: "url", placeholder: "/portrait.jpg 或 https://…", set: (value) => { content.portrait.src = value; } });
    createField(grid, { label: "替代文本", value: content.portrait.alt, path: "portrait.alt", maxLength: 500, help: "描述照片内容；纯装饰图片可以留空。", set: (value) => { content.portrait.alt = value; } });
    createField(grid, { label: "裁切位置（可选）", value: content.portrait.objectPosition, path: "portrait.objectPosition", maxLength: 50, placeholder: "50% 30%", help: "CSS object-position，例如 center、50% 30%。", set: (value) => setOptional(content.portrait, "objectPosition", value) });
  }

  body = createSection("section-focus", "02 · Focus", "关注方向", "首页展示的研究和工程关注领域。", openIds);
  renderObjectArray(body, {
    title: "关注领域", itemLabel: "关注领域", items: content.focusAreas, path: "focusAreas", max: 16, sectionId: "focus", openIds, firstKey: "title",
    create: (index) => ({ index: String(index + 1).padStart(2, "0"), title: "", description: "", tags: [] }),
    label: (item, index) => item.title || `关注领域 ${index + 1}`,
    render: (host, item, _index, path) => {
      createField(host, { label: "序号", value: item.index, path: `${path}.index`, maxLength: 500, set: (value) => { item.index = value; } });
      createField(host, { label: "标题", value: item.title, path: `${path}.title`, maxLength: 500, set: (value) => { item.title = value; } });
      createField(host, { label: "描述", value: item.description, path: `${path}.description`, multiline: true, rows: 4, maxLength: 12000, wide: true, set: (value) => { item.description = value; } });
      renderStringArray(host, { title: "标签", itemLabel: "标签", items: item.tags, path: `${path}.tags`, max: 64, maxLength: 500, wide: true });
    },
  });

  body = createSection("section-education", "03 · Education", "教育", "学校、课程与学习经历。", openIds);
  renderResumeSection(body, { title: "教育经历", itemLabel: "教育经历", items: content.education, path: "education", max: 24, sectionId: "education", prefix: "education" }, openIds);

  body = createSection("section-experience", "04 · Experience", "工作与实践经历", "实习、工作和工程实践。", openIds);
  renderResumeSection(body, { title: "实践经历", itemLabel: "经历", items: content.experience, path: "experience", max: 32, sectionId: "experience", prefix: "experience" }, openIds);

  body = createSection("section-projects", "05 · Research & Publications", "研究、项目与出版成果", "现有 HomeContent 将研究、项目及可公开的出版成果统一存放在 projects；可用类型、状态和标签区分。", openIds);
  renderResumeSection(body, { title: "研究与项目", help: "可为论文、研究课题、工程项目分别设置类型与状态。", itemLabel: "研究 / 项目", items: content.projects, path: "projects", max: 64, sectionId: "projects", prefix: "project" }, openIds);

  body = createSection("section-awards", "06 · Awards", "竞赛与获奖", "奖项按照当前数组顺序展示。", openIds);
  renderObjectArray(body, {
    title: "奖项", itemLabel: "奖项", items: content.awards, path: "awards", max: 64, sectionId: "awards", openIds, firstKey: "title",
    create: () => ({ year: "", title: "", award: "", description: "" }), label: (item, index) => item.title || `奖项 ${index + 1}`,
    render: (host, item, _index, path) => {
      createField(host, { label: "年份", value: item.year, path: `${path}.year`, maxLength: 500, set: (value) => { item.year = value; } });
      createField(host, { label: "竞赛 / 荣誉名称", value: item.title, path: `${path}.title`, maxLength: 500, set: (value) => { item.title = value; } });
      createField(host, { label: "奖项等级", value: item.award, path: `${path}.award`, maxLength: 500, set: (value) => { item.award = value; } });
      createField(host, { label: "说明", value: item.description, path: `${path}.description`, multiline: true, rows: 3, maxLength: 12000, wide: true, set: (value) => { item.description = value; } });
    },
  });

  body = createSection("section-skills", "07 · Skills & Languages", "技能、语言与海外交流", "技能与语言使用同一分组模型；可新增“语言”分组。", openIds);
  renderObjectArray(body, {
    title: "技能与语言分组", help: "例如“编程与后端”“语言能力”。", itemLabel: "分组", items: content.skills, path: "skills", max: 32, sectionId: "skills", openIds, firstKey: "title",
    create: () => ({ title: "", items: [] }), label: (item, index) => item.title || `技能分组 ${index + 1}`,
    render: (host, item, _index, path) => {
      createField(host, { label: "分组标题", value: item.title, path: `${path}.title`, maxLength: 500, wide: true, set: (value) => { item.title = value; } });
      renderStringArray(host, { title: "技能 / 语言", itemLabel: "条目", items: item.items, path: `${path}.items`, max: 64, maxLength: 500, wide: true });
    },
  });
  grid = createFieldset(body, "海外交流", "HomeContent 中海外交流是一个固定条目。");
  renderResumeFields(grid, content.exchange, 0, "exchange", openIds);

  body = createSection("section-contact", "08 · Contact", "联系方式", "联系区标题、正文和外部链接。", openIds);
  grid = createFieldset(body, "联系区文案");
  createField(grid, { label: "标题", value: content.contact.heading, path: "contact.heading", multiline: true, rows: 3, maxLength: 12000, wide: true, set: (value) => { content.contact.heading = value; } });
  createField(grid, { label: "正文", value: content.contact.body, path: "contact.body", multiline: true, rows: 4, maxLength: 12000, wide: true, set: (value) => { content.contact.body = value; } });
  createField(grid, { label: "补充说明（可选）", value: content.contact.note, path: "contact.note", multiline: true, rows: 3, maxLength: 12000, wide: true, set: (value) => setOptional(content.contact, "note", value) });
  renderObjectArray(grid, {
    title: "联系链接", itemLabel: "链接", items: content.contact.links, path: "contact.links", max: 16, sectionId: "contact-links", openIds, firstKey: "label",
    create: () => ({ label: "", href: "" }), label: (item, index) => item.label || `链接 ${index + 1}`,
    render: (host, item, _index, path) => {
      createField(host, { label: "链接名称", value: item.label, path: `${path}.label`, maxLength: 500, set: (value) => { item.label = value; } });
      createField(host, { label: "地址", value: item.href, path: `${path}.href`, maxLength: 2000, inputMode: "url", placeholder: "https://…、mailto:… 或 /站内路径", set: (value) => { item.href = value; } });
    },
  });

  body = createSection("section-interface", "09 · Interface copy", "界面文案与待确认内容", "导航、按钮、各区块标题，以及草稿状态下显示的待确认材料。", openIds);
  grid = createFieldset(body, "通用界面文案");
  const uiFields = [
    ["draftLabel", "草稿标签"], ["draftText", "草稿说明", true], ["navLabel", "导航无障碍名称"], ["homeLabel", "首页名称"],
    ["greeting", "问候语"], ["viewWork", "查看项目按钮"], ["contactCta", "联系按钮"], ["highlights", "要点标签"],
    ["tagsLabel", "标签区名称"], ["currentStatus", "状态标签"], ["backToTop", "回到顶部"], ["themeToLight", "切换浅色主题"], ["themeToDark", "切换深色主题"],
  ];
  uiFields.forEach(([key, label, multiline]) => createField(grid, {
    label, value: content.ui[key], path: `ui.${key}`, multiline: Boolean(multiline), rows: 2, maxLength: multiline ? 12000 : 500, wide: Boolean(multiline), set: (value) => { content.ui[key] = value; },
  }));

  grid = createFieldset(body, "导航名称");
  [["about", "关于"], ["focus", "关注方向"], ["resume", "经历"], ["work", "项目"], ["contact", "联系"]].forEach(([key, label]) => {
    createField(grid, { label, value: content.ui.nav[key], path: `ui.nav.${key}`, maxLength: 500, set: (value) => { content.ui.nav[key] = value; } });
  });

  grid = createFieldset(body, "区块标题", "每个区块包含显示序号、英文眉题、标题和可选描述。");
  sectionKeys.forEach(([key, label]) => {
    const section = content.ui.sections[key];
    const sectionFieldset = element("fieldset", "section-copy");
    sectionFieldset.append(element("legend", "", label));
    const sectionGrid = element("div", "field-grid");
    createField(sectionGrid, { label: "序号", value: section.index, path: `ui.sections.${key}.index`, maxLength: 500, set: (value) => { section.index = value; } });
    createField(sectionGrid, { label: "眉题", value: section.eyebrow, path: `ui.sections.${key}.eyebrow`, maxLength: 500, set: (value) => { section.eyebrow = value; } });
    createField(sectionGrid, { label: "标题", value: section.title, path: `ui.sections.${key}.title`, maxLength: 500, wide: true, set: (value) => { section.title = value; } });
    createField(sectionGrid, { label: "描述（可选）", value: section.description, path: `ui.sections.${key}.description`, multiline: true, rows: 2, maxLength: 12000, wide: true, set: (value) => setOptional(section, "description", value) });
    sectionFieldset.append(sectionGrid);
    grid.append(sectionFieldset);
  });

  grid = createFieldset(body, "待确认内容", "仅在 draftMode 开启时于前台展示。");
  renderStringArray(grid, { title: "发布前待办", itemLabel: "待办", items: content.missingContent, path: "missingContent", max: 32, multiline: true, rows: 2, maxLength: 12000, wide: true });
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function canRenderContent(value) {
  if (!isObject(value) || value.locale !== locale) return false;
  const arrays = ["headlineLines", "facts", "focusAreas", "education", "experience", "projects", "awards", "skills", "missingContent"];
  if (arrays.some((key) => !Array.isArray(value[key]))) return false;
  const isLink = (item) => isObject(item);
  const isMedia = (item) => isObject(item)
    && isLink(item.source)
    && (item.license === undefined || isLink(item.license));
  const isResume = (item) => isObject(item)
    && Array.isArray(item.highlights)
    && Array.isArray(item.tags)
    && (item.media === undefined || isMedia(item.media))
    && (item.links === undefined || (Array.isArray(item.links) && item.links.every(isLink)));
  return isObject(value.seo)
    && (value.portrait === undefined || isObject(value.portrait))
    && value.facts.every(isObject)
    && value.focusAreas.every((item) => isObject(item) && Array.isArray(item.tags))
    && value.education.every(isResume)
    && value.experience.every(isResume)
    && value.projects.every(isResume)
    && value.awards.every(isObject)
    && value.skills.every((item) => isObject(item) && Array.isArray(item.items))
    && isResume(value.exchange)
    && isObject(value.contact) && Array.isArray(value.contact.links) && value.contact.links.every(isObject)
    && isObject(value.ui) && isObject(value.ui.nav) && isObject(value.ui.sections)
    && sectionKeys.every(([key]) => isObject(value.ui.sections[key]));
}

function parseJsonEditor() {
  let parsed;
  try {
    parsed = JSON.parse(editor.value);
  } catch (error) {
    setMessage(`JSON 格式错误：${error.message}`, "error");
    editor.focus();
    return null;
  }
  if (!isObject(parsed)) {
    setMessage("JSON 根节点必须是对象。", "error");
    editor.focus();
    return null;
  }
  if (parsed.locale !== locale) {
    setMessage(`locale 必须是当前语言“${locale}”，当前值为“${String(parsed.locale)}”。`, "error");
    editor.focus();
    return null;
  }
  return parsed;
}

function setMode(nextMode) {
  if (nextMode === mode || !content) return;
  if (nextMode === "json") {
    editor.value = JSON.stringify(content, null, 2);
  } else {
    const parsed = parseJsonEditor();
    if (!parsed) return;
    if (!canRenderContent(parsed)) {
      setMessage("JSON 缺少结构化表单所需字段。可继续在高级模式修复，保存时服务端会给出完整校验结果。", "error");
      return;
    }
    content = parsed;
    renderStructured();
  }
  mode = nextMode;
  const formActive = mode === "form";
  structuredEditor.hidden = !formActive;
  jsonPanel.hidden = formActive;
  formModeButton.classList.toggle("active", formActive);
  jsonModeButton.classList.toggle("active", !formActive);
  formModeButton.setAttribute("aria-pressed", String(formActive));
  jsonModeButton.setAttribute("aria-pressed", String(!formActive));
  setMessage(formActive ? "已切换到结构化表单。" : "已切换到高级 JSON；修改会在保存时校验。");
}

function validUrl(value, allowMailto = true) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  if (normalized.length > 2000) return false;
  if (normalized.startsWith("/") && !normalized.startsWith("//")) return true;
  if (allowMailto && normalized.startsWith("mailto:")) return true;
  try {
    return ["http:", "https:"].includes(new URL(normalized).protocol);
  } catch {
    return false;
  }
}

function validObjectPosition(value) {
  if (value === undefined || value === "") return true;
  if (typeof value !== "string") return false;
  const tokens = value.trim().split(/\s+/);
  if (tokens.length < 1 || tokens.length > 2) return false;
  return tokens.every((token) => {
    if (["left", "center", "right", "top", "bottom"].includes(token)) return true;
    if (!/^\d{1,3}(?:\.\d+)?%$/.test(token)) return false;
    return Number.parseFloat(token) <= 100;
  });
}

function clientIssues(value) {
  const issues = [];
  const validateResumeItem = (item, path, seenIds) => {
    const id = String(item?.id || "").trim();
    if (!/^[a-z0-9-]{1,120}$/.test(id)) issues.push({ path: [...path, "id"], message: "ID 只能包含小写字母、数字和连字符" });
    else if (seenIds?.has(id)) issues.push({ path: [...path, "id"], message: "同一列表中的 ID 不可重复" });
    seenIds?.add(id);
    if (item?.media && !validUrl(item.media.src, false)) issues.push({ path: [...path, "media", "src"], message: "请填写 http(s) 或以单斜杠开头的站内媒体地址" });
    if (item?.media && !validUrl(item.media.source?.href)) issues.push({ path: [...path, "media", "source", "href"], message: "请填写 http(s)、mailto 或以单斜杠开头的来源地址" });
    if (item?.media?.license && !validUrl(item.media.license.href)) issues.push({ path: [...path, "media", "license", "href"], message: "请填写 http(s)、mailto 或以单斜杠开头的许可证地址" });
    if (Array.isArray(item?.links)) {
      item.links.forEach((link, linkIndex) => {
        if (!validUrl(link?.href)) issues.push({ path: [...path, "links", linkIndex, "href"], message: "请填写 http(s)、mailto 或以单斜杠开头的外部链接地址" });
      });
    }
  };
  if (!Array.isArray(value.headlineLines) || value.headlineLines.length < 1) issues.push({ path: ["headlineLines"], message: "至少需要一个 Hero 标题行" });
  if (Array.isArray(value.headlineLines) && value.headlineLines.length > 5) issues.push({ path: ["headlineLines"], message: "Hero 标题行最多 5 个" });
  if (value.portrait && !validUrl(value.portrait.src, false)) issues.push({ path: ["portrait", "src"], message: "请填写 http(s) 或以单斜杠开头的站内图片地址" });
  if (value.portrait && !validObjectPosition(value.portrait.objectPosition)) issues.push({ path: ["portrait", "objectPosition"], message: "请使用 left/center/right/top/bottom 或 0%–100% 的一至两个位置值" });
  if (Array.isArray(value.contact?.links)) {
    value.contact.links.forEach((link, index) => {
      if (!validUrl(link?.href)) issues.push({ path: ["contact", "links", index, "href"], message: "请填写 http(s)、mailto 或以单斜杠开头的站内地址" });
    });
  }
  [["education", value.education], ["experience", value.experience], ["projects", value.projects]].forEach(([key, items]) => {
    if (!Array.isArray(items)) return;
    const seen = new Set();
    items.forEach((item, index) => {
      validateResumeItem(item, [key, index], seen);
    });
  });
  validateResumeItem(value.exchange, ["exchange"]);
  return issues;
}

function setButtonBusy(button, busy, busyText) {
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = busy;
  button.textContent = busy ? busyText : button.dataset.label;
}

function setReleaseMutationBusy(busy) {
  releaseMutation = busy;
  publishButton.disabled = busy;
  document.querySelector("#refresh-history").disabled = busy;
  document.querySelectorAll("#release-list button").forEach((button) => { button.disabled = busy; });
  saveButton.disabled = busy || saving || !content;
  reloadButton.disabled = busy || saving;
  formModeButton.disabled = busy || saving;
  jsonModeButton.disabled = busy || saving;
  document.querySelectorAll("[data-locale]").forEach((button) => { button.disabled = busy || saving; });
  form.inert = busy;
  editor.readOnly = busy;
  document.querySelector("#release-note").disabled = busy;
  if (!busy) syncIdleControls();
}

function syncIdleControls() {
  const loading = !content;
  saveButton.disabled = loading || saving || releaseMutation;
  reloadButton.disabled = saving || releaseMutation;
  formModeButton.disabled = loading || saving || releaseMutation;
  jsonModeButton.disabled = loading || saving || releaseMutation;
  publishButton.disabled = loading || saving || releaseMutation || !generationLoaded;
  document.querySelector("#release-note").disabled = saving || releaseMutation;
  document.querySelectorAll("[data-locale]").forEach((button) => { button.disabled = saving || releaseMutation; });
}

async function loadDraft() {
  const requestedLocale = locale;
  const sequence = ++loadSequence;
  loadController?.abort();
  loadController = new AbortController();
  statusNode.textContent = "正在载入";
  structuredEditor.replaceChildren(element("p", "editor-placeholder", `正在读取${localeLabels[requestedLocale]}内容…`));
  structuredEditor.setAttribute("aria-busy", "true");
  structuredEditor.inert = true;
  editor.value = "";
  editor.readOnly = true;
  setButtonBusy(reloadButton, true, "载入中…");
  saveButton.disabled = true;
  setMessage("");
  try {
    const data = await request(`/admin/api/profiles/${requestedLocale}/draft/`, { signal: loadController.signal });
    if (sequence !== loadSequence || requestedLocale !== locale) return;
    if (!canRenderContent(data.content)) throw new Error("服务端返回的内容结构不完整或语言不匹配");
    revision = data.revision;
    content = data.content;
    editor.value = JSON.stringify(content, null, 2);
    revisionNode.textContent = String(revision);
    statusNode.textContent = data.source === "d1" ? "D1 草稿" : "仓库初始内容";
    renderStructured();
    if (mode === "json") {
      structuredEditor.hidden = true;
      jsonPanel.hidden = false;
    }
    setDirty(false);
    updateLocaleUi();
  } catch (error) {
    if (error.name === "AbortError") return;
    if (sequence !== loadSequence) return;
    statusNode.textContent = "载入失败";
    structuredEditor.setAttribute("aria-busy", "false");
    setMessage(error.message, "error");
  } finally {
    if (sequence === loadSequence) {
      setButtonBusy(reloadButton, false, "载入中…");
      saveButton.disabled = !content;
      structuredEditor.inert = false;
      editor.readOnly = false;
      syncIdleControls();
    }
  }
}

async function saveDraft() {
  if (!content || saving || releaseMutation) return;
  let nextContent = content;
  if (mode === "json") {
    nextContent = parseJsonEditor();
    if (!nextContent) return;
  } else {
    clearValidationErrors();
    if (!form.checkValidity()) {
      form.reportValidity();
      setMessage("请先修正表单中标出的必填项或格式错误。", "error");
      return;
    }
  }
  const issues = clientIssues(nextContent);
  if (issues.length) {
    if (mode === "form") showValidationIssues(issues);
    else setMessage(`请修正内容：\n${issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")}`, "error");
    return;
  }

  const savedLocale = locale;
  const expectedRevision = revision;
  saving = true;
  statusNode.textContent = "正在保存";
  setMessage("正在保存…");
  setButtonBusy(saveButton, true, "保存中…");
  reloadButton.disabled = true;
  formModeButton.disabled = true;
  jsonModeButton.disabled = true;
  publishButton.disabled = true;
  document.querySelectorAll("[data-locale]").forEach((button) => { button.disabled = true; });
  form.setAttribute("aria-busy", "true");
  structuredEditor.inert = true;
  editor.readOnly = true;
  try {
    const data = await request(`/admin/api/profiles/${savedLocale}/draft/`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: nextContent, expectedRevision }),
    });
    if (locale !== savedLocale) return;
    revision = data.revision;
    content = data.content;
    if (data.id && draftHeads) draftHeads[savedLocale] = { versionId: data.id, revision: data.revision };
    revisionNode.textContent = String(revision);
    statusNode.textContent = "草稿已保存";
    editor.value = JSON.stringify(content, null, 2);
    renderStructured(collectOpenDetails());
    if (mode === "json") {
      structuredEditor.hidden = true;
      jsonPanel.hidden = false;
    }
    setDirty(false);
    setMessage(`保存成功：revision ${revision}`, "success");
    await loadVersions();
  } catch (error) {
    statusNode.textContent = "保存失败";
    if (error.status === 409) {
      setMessage(`检测到其他会话已更新（最新 revision ${error.data.currentRevision}）。为避免覆盖，请重新载入后再编辑。`, "error");
    } else if (Array.isArray(error.data?.issues)) {
      if (mode === "form") showValidationIssues(error.data.issues);
      else setMessage(`服务端校验失败：\n${error.data.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")}`, "error");
    } else {
      setMessage(error.message, "error");
    }
  } finally {
    saving = false;
    form.removeAttribute("aria-busy");
    structuredEditor.inert = false;
    editor.readOnly = false;
    setButtonBusy(saveButton, false, "保存中…");
    syncIdleControls();
  }
}

function metadataRow(titleText, metaText, bodyText, action) {
  const row = element("article", "history-row");
  const copy = element("div", "history-row__copy");
  copy.append(element("strong", "", titleText), element("span", "", metaText));
  if (bodyText) copy.append(element("p", "", bodyText));
  if (action) row.append(copy, action);
  else row.append(copy);
  return row;
}

async function loadVersions() {
  const requestedLocale = locale;
  const sequence = ++versionSequence;
  const list = document.querySelector("#version-list");
  list.setAttribute("aria-busy", "true");
  list.replaceChildren(element("p", "empty-state", "正在载入草稿版本…"));
  try {
    const data = await request(`/admin/api/profiles/${requestedLocale}/versions/`);
    if (requestedLocale !== locale || sequence !== versionSequence) return;
    if (!data.versions.length) {
      list.replaceChildren(element("p", "empty-state", "当前语言还没有已保存的草稿版本。"));
      return;
    }
    list.replaceChildren(...data.versions.map((version) => {
      const link = element("a", "secondary-button", "预览此修订 ↗");
      link.href = `/admin/preview/${requestedLocale}/?v=${encodeURIComponent(version.id)}`;
      link.target = "_blank";
      link.rel = "noopener";
      link.setAttribute("aria-label", `在新窗口预览 revision ${version.revision}`);
      const current = version.revision === revision ? " · 当前草稿" : "";
      return metadataRow(
        `Revision ${version.revision}${current}`,
        `${new Date(version.createdAt).toLocaleString()} · ${version.createdBy}`,
        `Schema v${version.schemaVersion} · ${String(version.hash).slice(0, 12)}…`,
        link,
      );
    }));
  } catch (error) {
    if (requestedLocale === locale && sequence === versionSequence) list.replaceChildren(element("p", "empty-state empty-state--error", `草稿版本载入失败：${error.message}`));
  } finally {
    if (requestedLocale === locale && sequence === versionSequence) list.setAttribute("aria-busy", "false");
  }
}

async function loadReleases(force = false) {
  if (releaseMutation && !force) return;
  const sequence = ++releaseSequence;
  generationLoaded = false;
  syncIdleControls();
  const list = document.querySelector("#release-list");
  list.setAttribute("aria-busy", "true");
  list.replaceChildren(element("p", "empty-state", "正在载入发布历史…"));
  try {
    const data = await request("/admin/api/releases/");
    if (sequence !== releaseSequence) return;
    generation = data.generation;
    draftHeads = data.draftHeads || {};
    generationLoaded = true;
    generationNode.textContent = String(generation);
    syncIdleControls();
    if (!data.releases.length) {
      list.replaceChildren(element("p", "empty-state", "还没有发布记录。"));
      return;
    }
    list.replaceChildren(...data.releases.map((release) => {
      const button = element("button", "secondary-button", "恢复整站到此版本");
      button.type = "button";
      button.disabled = releaseMutation;
      button.addEventListener("click", () => restoreRelease(release.id, release.sequence, button));
      return metadataRow(
        `Release #${release.sequence}`,
        `${new Date(release.publishedAt).toLocaleString()} · ${release.publishedBy}`,
        release.note || "无发布说明",
        button,
      );
    }));
  } catch (error) {
    if (sequence === releaseSequence) list.replaceChildren(element("p", "empty-state empty-state--error", `发布历史载入失败：${error.message}`));
  } finally {
    if (sequence === releaseSequence) list.setAttribute("aria-busy", "false");
    if (sequence === releaseSequence) syncIdleControls();
  }
}

async function publish() {
  if (publishButton.disabled || releaseMutation) return;
  if (!content) {
    setMessage("请等待当前语言草稿载入完成后再发布。", "error");
    return;
  }
  if (!generationLoaded) {
    setMessage("发布代次尚未成功载入，请先刷新发布历史。", "error");
    document.querySelector("#refresh-history").focus();
    return;
  }
  if (dirty) {
    setMessage("当前语言还有未保存修改。请先保存草稿，再发布三语内容。", "error");
    saveButton.focus();
    return;
  }
  if (!draftHeads?.zh?.versionId || !draftHeads?.en?.versionId || !draftHeads?.ja?.versionId) {
    setMessage("三种语言都至少需要保存一次草稿后才能发布。", "error");
    return;
  }
  const noteInput = document.querySelector("#release-note");
  setMessage("正在发布…");
  setReleaseMutationBusy(true);
  setButtonBusy(publishButton, true, "发布中…");
  try {
    const data = await request("/admin/api/releases/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        note: noteInput.value,
        expectedGeneration: generation,
        expectedDrafts: {
          zh: draftHeads.zh.versionId,
          en: draftHeads.en.versionId,
          ja: draftHeads.ja.versionId,
        },
      }),
    });
    noteInput.value = "";
    setMessage(`发布成功：Release #${data.release.sequence}`, "success");
    await loadReleases(true);
  } catch (error) {
    if (error.status === 409) setMessage("检测到其他会话刚刚发布了新版本，请刷新发布历史后重试。", "error");
    else setMessage(error.message, "error");
  } finally {
    setButtonBusy(publishButton, false, "发布中…");
    setReleaseMutationBusy(false);
  }
}

async function restoreRelease(id, sequence, button) {
  if (button.disabled || releaseMutation) return;
  if (!content) {
    setMessage("请等待当前语言草稿载入完成后再执行回滚。", "error");
    return;
  }
  if (!generationLoaded) {
    setMessage("发布代次尚未成功载入，请先刷新发布历史。", "error");
    document.querySelector("#refresh-history").focus();
    return;
  }
  if (dirty) {
    setMessage("当前语言还有未保存修改。请先保存或重新载入，再执行整站回滚。", "error");
    return;
  }
  if (!window.confirm(`确认创建一个新发布版本，将中、英、日三种内容全部恢复到 Release #${sequence}？草稿不会被删除。`)) return;
  setReleaseMutationBusy(true);
  setButtonBusy(button, true, "恢复中…");
  try {
    const data = await request(`/admin/api/releases/${encodeURIComponent(id)}/restore/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expectedGeneration: generation }),
    });
    setMessage(`已恢复并创建 Release #${data.release.sequence}`, "success");
    await loadReleases(true);
  } catch (error) {
    if (error.status === 409) setMessage("检测到其他会话刚刚发布或回滚了版本，请刷新发布历史后重试。", "error");
    else setMessage(error.message, "error");
  } finally {
    setButtonBusy(button, false, "恢复中…");
    setReleaseMutationBusy(false);
  }
}

function confirmDiscard() {
  return !dirty || window.confirm("当前语言有尚未保存的修改。确认放弃这些修改？");
}

document.querySelectorAll("[data-locale]").forEach((button) => {
  button.addEventListener("click", async () => {
    const nextLocale = button.dataset.locale;
    if (saving || releaseMutation || nextLocale === locale || !confirmDiscard()) return;
    locale = nextLocale;
    content = null;
    revision = 0;
    revisionNode.textContent = "—";
    document.querySelector("#version-list").replaceChildren(element("p", "empty-state", "等待载入当前语言的草稿版本…"));
    setDirty(false);
    updateLocaleUi();
    await loadDraft();
    if (locale === nextLocale) await loadVersions();
  });
});

document.querySelectorAll(".section-nav a").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (mode === "json") setMode("form");
    if (mode !== "form") {
      event.preventDefault();
      return;
    }
    const target = document.querySelector(link.getAttribute("href"));
    if (target instanceof HTMLDetailsElement) target.open = true;
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveDraft();
});
form.addEventListener("invalid", (event) => openAncestors(event.target), true);
editor.addEventListener("input", markDirty);
formModeButton.addEventListener("click", () => setMode("form"));
jsonModeButton.addEventListener("click", () => setMode("json"));
saveButton.addEventListener("click", saveDraft);
reloadButton.addEventListener("click", async () => {
  if (!confirmDiscard()) return;
  content = null;
  revision = 0;
  revisionNode.textContent = "—";
  document.querySelector("#version-list").replaceChildren(element("p", "empty-state", "等待重新载入草稿版本…"));
  setDirty(false);
  await loadDraft();
  await loadVersions();
});
previewLink.addEventListener("click", (event) => {
  if (dirty && !window.confirm("预览只会显示上次保存的草稿，当前未保存修改不会出现。仍要打开预览吗？")) event.preventDefault();
});
publishButton.addEventListener("click", publish);
document.querySelector("#refresh-history").addEventListener("click", loadReleases);
document.querySelector("#refresh-versions").addEventListener("click", () => {
  if (!content || saving || releaseMutation) return;
  loadVersions();
});
window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
});

updateLocaleUi();
syncIdleControls();
await Promise.all([loadDraft(), loadReleases()]);
await loadVersions();
