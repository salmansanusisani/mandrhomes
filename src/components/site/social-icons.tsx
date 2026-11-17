import type { SVGProps } from "react";

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.24 2.25h3.31l-7.23 8.26L23 21.75h-6.66l-5.22-6.82-5.96 6.82H1.85l7.73-8.84L1 2.25h6.83l4.71 6.23 5.7-6.23Zm-1.16 17.52h1.83L6.99 4.13H5.03l12.05 15.64Z" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.82A5.7 5.7 0 0 1 15.44 3h-3.1v12.18a2.7 2.7 0 1 1-2.7-2.7c.27 0 .53.04.78.11V9.43a5.94 5.94 0 0 0-.78-.05 5.92 5.92 0 1 0 5.92 5.92V8.9a8.7 8.7 0 0 0 4.48 1.22V7.02a5.24 5.24 0 0 1-3.44-1.2Z" />
    </svg>
  );
}

export function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.58 7.19a2.78 2.78 0 0 0-1.96-1.97C17.93 4.75 12 4.75 12 4.75s-5.93 0-7.62.47A2.78 2.78 0 0 0 2.42 7.2 29.16 29.16 0 0 0 1.95 12a29.16 29.16 0 0 0 .47 4.81 2.78 2.78 0 0 0 1.96 1.97c1.69.47 7.62.47 7.62.47s5.93 0 7.62-.47a2.78 2.78 0 0 0 1.96-1.97A29.16 29.16 0 0 0 22.05 12a29.16 29.16 0 0 0-.47-4.81ZM9.85 15.16V8.84L15.33 12l-5.48 3.16Z" />
    </svg>
  );
}
