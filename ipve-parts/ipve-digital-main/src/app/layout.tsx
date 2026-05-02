import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IPVE - Gestion Scolaire",
  description: "Système de Gestion Scolaire - Institut Polytechnique Vase d'Élites",
  icons: {
    icon: "https://ik.imagekit.io/damts929ip/IPVE/Logo.png?updatedAt=1776851379758",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var prefix = 'bis_';
                var specialAttrs = ['bis_skin_checked','bis_register','bis_use','bis_status','bis_frame_id','bis_body_id','bis_depth','bis_chainid','bis_size','__processed'];
                function cleanNode(node) {
                  if (node.nodeType !== 1) return;
                  var attrs = node.attributes;
                  for (var i = attrs.length - 1; i >= 0; i--) {
                    var name = attrs[i].name;
                    if (name.indexOf(prefix) === 0 || name.indexOf('__processed') === 0 || name === 'data-bis-config' || name === 'data-dynamic-id') {
                      node.removeAttribute(name);
                    }
                  }
                }
                function cleanTree(root) {
                  cleanNode(root);
                  var children = root.childNodes;
                  for (var j = 0; j < children.length; j++) {
                    if (children[j].nodeType === 1) cleanTree(children[j]);
                  }
                }
                cleanTree(document.documentElement);
                var observer = new MutationObserver(function(mutations) {
                  for (var m = 0; m < mutations.length; m++) {
                    var mut = mutations[m];
                    for (var n = 0; n < mut.addedNodes.length; n++) {
                      if (mut.addedNodes[n].nodeType === 1) cleanTree(mut.addedNodes[n]);
                    }
                    if (mut.type === 'attributes' && mut.target.nodeType === 1) cleanNode(mut.target);
                  }
                });
                observer.observe(document.documentElement, {
                  childList: true, subtree: true, attributes: true,
                  attributeFilter: specialAttrs.concat(['data-bis-config','data-dynamic-id'])
                });
                setTimeout(function() { observer.disconnect(); }, 3000);
              })();
            `,
          }}
        />
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
