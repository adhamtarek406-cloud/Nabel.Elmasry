# Updating the website

This guide is for Nabel, or anyone updating the site. You don't need to know how to code.

The site has two pages, English and Arabic, and they share one set of content files. When you add a project or change the phone number once, both languages update.

## What lives where

| To change... | Edit this | Both languages? |
|---|---|---|
| Portfolio projects (add, remove, reorder, rename) | `content/projects.json` | Yes, English and Arabic sit side by side in the same entry |
| Email, phone, Instagram, the numbers (15 years, 60+ residences…) | `content/site.json` | Yes |
| Portfolio photos | `assets/img/` folder | Shared |
| Headlines and paragraphs | `index.html` (English) and `ar/index.html` (Arabic) | No, edit each file |

Leave the `css` and `js` folders alone. They control the design and animations.

---

## Option A: the admin panel (recommended)

Once the site is on GitHub (see "One-time setup" at the end), you can edit it from a web form in your browser. No files, no code.

**To add a project:**

1. Go to **https://app.pagescms.org** and sign in with GitHub.
2. Open the website's project.
3. Click **Portfolio projects**, then **Add an entry**.
4. Fill in the form:
   - **Title (English)** and **Title (Arabic)**: the room and the place, e.g. "Master suite, Heliopolis palace".
   - **Category**: Residence, Palace or Hospitality. This decides which filter button shows it.
   - **Year**.
   - **Photo**: upload it here (see "Preparing photos" below).
   - **Details line**: the workshop and collection, e.g. "Soher · Iris collection". The year is added for you.
   - **Photo description**: one plain sentence about what's in the photo. Blind visitors hear it read aloud, and Google uses it.
5. Click **Save**. The live site updates in a minute or two.

**To reorder projects:** drag them in the list. The first project is always shown largest.

**To remove a project:** open it and delete it. Its photo stays in the folder, which does no harm.

**To change the phone, email, Instagram or numbers:** click **Contact details and numbers**, edit, and save.

---

## Option B: editing the files directly

If you'd rather not use the admin panel, open the files in any text editor. On GitHub you can click the file, then the pencil icon.

### Adding a project to `content/projects.json`

The file is a list of projects between square brackets `[ ]`. Each project sits between curly brackets `{ }`, and projects are separated by commas. The easiest way to add one is to copy an existing project, paste it, and change the text:

```json
  {
    "title_en": "Private library, Zamalek",
    "title_ar": "مكتبة خاصة، الزمالك",
    "category": "res",
    "year": 2026,
    "image": "assets/img/zamalek-library.jpg",
    "details_en": "Franco Furniture",
    "details_ar": "فرانكو فرنتشر",
    "alt_en": "Walnut bookshelves around a leather reading chair",
    "alt_ar": "رفوف كتب من خشب الجوز حول كرسي قراءة جلدي"
  },
```

- **category** must be exactly one of: `res` (residence), `pal` (palace), `hos` (hospitality).
- **image** is the photo's path. Put the photo in `assets/img/` first.
- Keep the quote marks `"` around text. Don't put quotes around the year.
- Every project except the last one ends with a comma after its `}`.

If a single comma or quote is missing, the portfolio will look empty. Paste the whole file into **https://jsonlint.com** and it will point to the exact line.

### Changing contact details in `content/site.json`

```json
{
  "email": "atelier@nabelelmasry.com",
  "phone": "+20 100 123 4567",
  "instagram": "https://instagram.com/nabelelmasry",
  "years_in_practice": 15,
  "residences_furnished": 60,
  "spanish_workshops": 2
}
```

Write the phone number the way it should appear. The call link is made from it automatically.

---

## Preparing photos

- **Shape:** landscape (wider than tall) works best everywhere on the page.
- **Size:** about 1600 pixels wide and under 400 KB. Photos straight from a camera or phone are often 5 MB or more, which slows the site down on mobile data.
- **To shrink a photo:** open **https://squoosh.app**, drop the photo in, set the width to 1600, choose "MozJPEG" at quality 75, and download.
- **File names:** lowercase, no spaces, e.g. `zamalek-library.jpg`. `Zamalek Library.JPG` may not load on the live site.

---

## Changing headlines and paragraphs

These are written directly in the two page files, so change **both**:

- English: `index.html`
- Arabic: `ar/index.html`

Search the file for the sentence you want to change and edit only the words between the tags. For example, in

```html
<h1 data-split>The quiet<br>grandeur.</h1>
```

change only `The quiet` and `grandeur.`. `<br>` is a line break, so keep it or move it. Don't delete the parts inside `< >`.

---

## Checking changes before they go live

Opening `index.html` by double-clicking it **won't** show the portfolio, because the browser blocks the content files. To preview on your own computer, install Node.js from https://nodejs.org, open a terminal in the website folder, and run:

```
npx http-server -p 5173
```

Then visit http://localhost:5173 (English) and http://localhost:5173/ar/ (Arabic).

---

## If something looks wrong

| Problem | Likely cause |
|---|---|
| Portfolio is empty | A missing comma or quote in `projects.json`. Check it at jsonlint.com. |
| One photo is blank | The file name in `image` doesn't exactly match the file in `assets/img/`, including capital letters. |
| Arabic shows English text | `title_ar` or `details_ar` is empty for that project, so the English is used instead. |
| A change doesn't appear | Wait two minutes and refresh with Ctrl+Shift+R (Cmd+Shift+R on Mac). |

---

## One-time setup (for whoever puts the site online)

1. Put this folder in a GitHub repository.
2. Connect the repository to a host that publishes automatically on every change: Netlify, Cloudflare Pages, Vercel or GitHub Pages all work for free. It's a static site, so there's no build command, and the publish folder is the root.
3. Point the domain (e.g. nabelelmasry.com) at the host.
4. Sign in at https://app.pagescms.org with the GitHub account that owns the repository and give it access to that repository. It reads `.pages.yml` from the folder and builds the admin forms from it.
5. To give Nabel access, add Nabel's GitHub account to the repository as a collaborator.

After that, every save in the admin panel updates GitHub, and the host republishes the site on its own.
