# evanle.dev

Personal portfolio website hosted on GitHub Pages.

## Features

- **Home Page**: Hero section with featured projects and blog preview
- **About Page**: Personal introduction, skills, and contact information
- **Gallery Page**: Showcase of GitHub repositories and projects
- **Blog Page**: Blog posts with navigation and pagination

## Getting Started

### Setting Up GitHub Pages

1. Create a new repository on GitHub (e.g., `evanle-dev` or your username)

2. Upload all files from this directory to the repository

3. Go to your repository Settings → Pages

4. Under "Source", select the branch (usually `main` or `master`) and folder (`/`)

5. Click Save

6. Your site will be available at `https://yourusername.github.io/evanle-dev/`

### Using a Custom Domain (evanle.dev)

1. In your repository settings, go to Pages

2. Under "Custom domain", enter `evanle.dev`

3. Configure your DNS records:
   - Add an A record: `@` → `185.199.108.153`
   - Add an A record: `@` → `185.199.109.153`
   - Add an A record: `@` -> `185.199.110.153`
   - Add an A record: `@` -> `185.199.111.153`
   
   OR
   
   - Add a CNAME record: `@` → `yourusername.github.io`

4. Wait for DNS propagation (can take up to 24 hours)

5. Enable "Enforce HTTPS" once available

## Customization

### Updating Content

1. **Home Page** (`index.html`): Edit the hero section and featured projects
2. **About Page** (`about.html`): Update your bio, skills, and contact info
3. **Gallery Page** (`gallery.html`): Add your GitHub repositories with links
4. **Blog Page** (`blog.html`): Add your blog posts with dates and content

### Updating GitHub Links

Replace all `https://github.com/username/repo` with your actual GitHub repository URLs.

### Changing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #0066cc;    /* Main color */
    --secondary-color: #333;     /* Footer color */
    --text-color: #333;          /* Text color */
    --bg-color: #fff;            /* Background color */
}
```

### Adding Images

1. Create an `images` folder
2. Add your images
3. Update the image paths in HTML files

## File Structure

```
evanle-dev/
├── index.html          # Home page
├── about.html          # About page
├── gallery.html        # Gallery page
├── blog.html           # Blog page
├── styles.css          # Stylesheet
└── README.md           # This file
```

## Technologies Used

- HTML5
- CSS3
- GitHub Pages (hosting)

## License

Personal project - feel free to use as inspiration for your own portfolio!

## Contact

Update contact information in `about.html` and footer links.
