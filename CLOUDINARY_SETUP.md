# Cloudinary Setup

Cloud name: `dfajt5l0p`  
Upload preset: `ml_default`

## Required: Enable Unsigned Uploads

The browser uploads directly to Cloudinary (no server needed), but the
upload preset must be set to **unsigned**. Do this once:

1. Go to [cloudinary.com](https://cloudinary.com) → sign in
2. Click **Settings** (gear icon, top right)
3. Click **Upload** tab
4. Scroll to **Upload presets**
5. Find `ml_default` → click the pencil (edit) icon
6. Change **Signing Mode** from `Signed` → `Unsigned`
7. Click **Save**

That's it. Product images will now upload from the admin panel directly
to Cloudinary and the URL gets saved in Firestore.

## Folder structure in Cloudinary

Images are organised automatically:
- Product images → `elikemdots/products/`
- Testimonial photos → `elikemdots/testimonials/`
