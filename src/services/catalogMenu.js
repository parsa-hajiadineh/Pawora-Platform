const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../../data/catalog-menu.json");
const MAX_LABEL = 64;

let catsRef = null;

function readExtra() {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (parsed && typeof parsed === "object") {
      return {
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        brands: Array.isArray(parsed.brands) ? parsed.brands : [],
      };
    }
  } catch {
    /* missing or invalid file = no extras */
  }
  return { categories: [], brands: [] };
}

function persist(extra) {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(extra, null, 2), "utf8");
}

function hydrate(list) {
  if (!Array.isArray(list)) return;
  catsRef = list;
  const extra = readExtra();
  for (const item of extra.categories) {
    const btn = String(item?.btn || "").trim();
    if (!btn || list.some((c) => c.btn === btn)) continue;
    const subMenus = Array.isArray(item.subMenus)
      ? item.subMenus.map((s) => String(s || "").trim()).filter(Boolean)
      : [];
    list.push({ btn, subMenus });
  }
  for (const row of extra.brands) {
    const catBtn = String(row?.cat || "").trim();
    const brand = String(row?.brand || "").trim();
    const cat = list.find((c) => c.btn === catBtn);
    if (!cat || !brand || cat.subMenus.includes(brand)) continue;
    cat.subMenus.push(brand);
  }
}

function normalizeLabel(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function addCategory(btn) {
  const name = normalizeLabel(btn);
  if (!catsRef) return { ok: false, error: "منوی دسته‌بندی آماده نیست." };
  if (!name) return { ok: false, error: "نام دسته‌بندی را بفرستید." };
  if (name.length > MAX_LABEL) {
    return { ok: false, error: `نام باید حداکثر ${MAX_LABEL} کاراکتر باشد.` };
  }
  if (catsRef.some((c) => c.btn === name)) {
    return { ok: false, error: "این دسته‌بندی از قبل وجود دارد." };
  }
  if (catsRef.some((c) => c.subMenus.includes(name))) {
    return { ok: false, error: "این نام الان به‌عنوان برند ثبت شده و قابل استفاده نیست." };
  }
  const extra = readExtra();
  extra.categories.push({ btn: name, subMenus: [] });
  persist(extra);
  catsRef.push({ btn: name, subMenus: [] });
  return { ok: true, name };
}

function addBrand(catIndex, brand) {
  const name = normalizeLabel(brand);
  if (!catsRef) return { ok: false, error: "منوی دسته‌بندی آماده نیست." };
  const cat = catsRef[catIndex];
  if (!cat) return { ok: false, error: "دسته‌بندی پیدا نشد." };
  if (!name) return { ok: false, error: "نام برند را بفرستید." };
  if (name.length > MAX_LABEL) {
    return { ok: false, error: `نام باید حداکثر ${MAX_LABEL} کاراکتر باشد.` };
  }
  if (catsRef.some((c) => c.btn === name)) {
    return { ok: false, error: "این نام با یک دسته‌بندی اصلی یکی است." };
  }
  if (cat.subMenus.includes(name)) {
    return { ok: false, error: "این برند در این دسته از قبل وجود دارد." };
  }
  const extra = readExtra();
  extra.brands.push({ cat: cat.btn, brand: name });
  persist(extra);
  cat.subMenus.push(name);
  return { ok: true, name, category: cat.btn };
}

module.exports = {
  hydrate,
  addCategory,
  addBrand,
};
