(()=>{var e={};e.id=1447,e.ids=[1447],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},84629:e=>{"use strict";e.exports=import("@libsql/client")},72254:e=>{"use strict";e.exports=require("node:buffer")},6005:e=>{"use strict";e.exports=require("node:crypto")},47261:e=>{"use strict";e.exports=require("node:util")},27546:(e,t,r)=>{"use strict";r.a(e,async(e,a)=>{try{r.r(t),r.d(t,{GlobalError:()=>l.a,__next_app__:()=>h,originalPathname:()=>m,pages:()=>f,routeModule:()=>x,tree:()=>p});var i=r(72872);r(78256),r(46182),r(35866);var n=r(23191),s=r(88716),o=r(37922),l=r.n(o),d=r(95231),c={};for(let e in d)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>d[e]);r.d(t,c);var u=e([i]);i=(u.then?(await u)():u)[0];let p=["",{children:["artikel",{children:["[id]",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,72872)),"C:\\Users\\ASUS\\OneDrive\\Documents\\Xampp1\\htdocs\\mudamudicengkareng\\app\\artikel\\[id]\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,78256)),"C:\\Users\\ASUS\\OneDrive\\Documents\\Xampp1\\htdocs\\mudamudicengkareng\\app\\layout.tsx"],loading:[()=>Promise.resolve().then(r.bind(r,46182)),"C:\\Users\\ASUS\\OneDrive\\Documents\\Xampp1\\htdocs\\mudamudicengkareng\\app\\loading.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,35866,23)),"next/dist/client/components/not-found-error"]}],f=["C:\\Users\\ASUS\\OneDrive\\Documents\\Xampp1\\htdocs\\mudamudicengkareng\\app\\artikel\\[id]\\page.tsx"],m="/artikel/[id]/page",h={require:r,loadChunk:()=>Promise.resolve()},x=new n.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/artikel/[id]/page",pathname:"/artikel/[id]",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:p}});a()}catch(e){a(e)}})},62123:(e,t,r)=>{Promise.resolve().then(r.bind(r,70102)),Promise.resolve().then(r.bind(r,56872)),Promise.resolve().then(r.bind(r,14618)),Promise.resolve().then(r.t.bind(r,79404,23))},14618:(e,t,r)=>{"use strict";r.d(t,{default:()=>n});var a=r(10326),i=r(17577);function n({articles:e=[],customText:t}){let[r,n]=(0,i.useState)(!1);if(!r)return null;let s=t||(e.length>0?e.map(e=>e.judul).join(" • "):"Portal informasi dan berita kegiatan generasi penerus jakarta barat 2");return a.jsx("div",{className:"breaking",suppressHydrationWarning:!0,children:a.jsx("div",{className:"wrap",children:(0,a.jsxs)("div",{className:"breaking-inner",children:[a.jsx("span",{className:"breaking-label",children:"Info Terkini"}),a.jsx("div",{className:"breaking-track",children:(0,a.jsxs)("div",{className:"breaking-scroll",children:[a.jsx("span",{className:"breaking-item",children:s}),a.jsx("span",{className:"breaking-item",children:s})]})})]})})})}},72872:(e,t,r)=>{"use strict";r.a(e,async(e,a)=>{try{r.r(t),r.d(t,{default:()=>x});var i=r(19510),n=r(9487),s=r(49033),o=r(57745),l=r(81445),d=r(58585),c=r(57371),u=r(53997),p=r(67030),f=r(41555),m=r(90455),h=e([n]);async function x({params:e}){let{id:t}=e,r=await (0,m.Gg)(),a=await n.db.query.artikel.findFirst({where:(0,o.eq)(s.artikel.id,t)});a&&("published"===a.status||"approved"===a.status)||r&&(r.userId===a?.authorId||["admin","pengurus_daerah","kmm_daerah"].includes(r.role))||(0,d.notFound)(),a||(0,d.notFound)();let h=await n.db.query.users.findFirst({where:(0,o.eq)(s.users.id,a.authorId)}),x=await n.db.select({id:s.artikel.id,judul:s.artikel.judul,coverImage:s.artikel.coverImage,publishedAt:s.artikel.publishedAt}).from(s.artikel).where((0,o.xD)((0,o.eq)(s.artikel.tipe,a.tipe),(0,o.ne)(s.artikel.id,a.id),(0,o.eq)(s.artikel.status,"published"))).orderBy((0,l.C)(s.artikel.publishedAt)).limit(4);return(0,i.jsxs)(i.Fragment,{children:[i.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Playfair+Display:wght@700;800;900&display=swap');

        .journal-wrap { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 80px 20px; 
          display: grid; 
          grid-template-columns: 1fr 300px; 
          gap: 60px;
        }

        .journal-body { 
          background: transparent; 
        }

        .journal-header { 
          border-bottom: 2px solid #1a1a1a; 
          padding-bottom: 40px; 
          margin-bottom: 50px; 
        }

        .journal-cat { 
          font-family: 'Inter', sans-serif;
          font-size: 11px; 
          font-weight: 800; 
          text-transform: uppercase; 
          letter-spacing: 2px; 
          color: #666;
          margin-bottom: 15px;
          display: block;
        }

        .journal-title { 
          font-family: 'Playfair Display', serif; 
          font-size: 52px; 
          font-weight: 800; 
          color: #1a1a1a; 
          line-height: 1.1; 
          margin-bottom: 30px; 
          letter-spacing: -1px;
        }

        .journal-meta { 
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          font-family: 'Merriweather', serif;
          font-style: italic;
          font-size: 15px;
          color: #444;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }

        .author-info { display: flex; align-items: center; gap: 10px; }
        .author-name { font-weight: 700; font-style: normal; text-decoration: underline; text-underline-offset: 4px; }

        .journal-actions { display: flex; gap: 12px; }
        .j-btn { 
          padding: 6px 14px; 
          border: 1px solid #1a1a1a; 
          font-size: 12px; 
          font-weight: 700; 
          text-transform: uppercase;
          text-decoration: none;
          color: #1a1a1a;
          transition: all 0.2s;
        }
        .j-btn:hover { background: #1a1a1a; color: white; }
        .j-btn-dark { background: #1a1a1a; color: white; }

        .journal-cover-wrap {
          margin-bottom: 50px;
          position: relative;
        }
        .journal-cover { 
          width: 100%; 
          aspect-ratio: 16/9;
          object-fit: cover; 
          filter: grayscale(20%);
          transition: filter 0.5s;
        }
        .journal-cover:hover { filter: grayscale(0%); }

        .journal-content { 
          font-family: 'Merriweather', serif;
          font-size: 20px; 
          line-height: 1.85; 
          color: #1a1a1a; 
          max-width: 720px;
          margin: 0 auto;
        }
        .journal-content p { margin-bottom: 32px; font-weight: 300; }
        .journal-content blockquote { 
          margin: 60px -40px; 
          padding: 0 40px;
          border-left: 3px solid #1a1a1a;
          font-size: 28px;
          line-height: 1.4;
          font-weight: 700;
          color: #000;
        }

        .sidebar-section { margin-bottom: 60px; }
        .sidebar-hd { 
          font-family: 'Playfair Display', serif;
          font-size: 20px; 
          font-weight: 800; 
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
          margin-bottom: 25px;
        }

        .j-related-card { 
          display: block; 
          text-decoration: none; 
          margin-bottom: 30px; 
          padding-bottom: 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        .j-related-cat { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #888; margin-bottom: 8px; display: block; }
        .j-related-title { 
          font-family: 'Playfair Display', serif;
          font-size: 18px; 
          font-weight: 700; 
          color: #1a1a1a; 
          line-height: 1.3;
          margin-bottom: 8px;
        }
        .j-related-title:hover { text-decoration: underline; }

        .j-cta { 
          background: #f9f9f9; 
          padding: 30px; 
          border: 1px solid #eee;
          text-align: center;
        }
        .j-cta-hd { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 800; margin-bottom: 15px; }
        .j-cta-txt { font-family: 'Merriweather', serif; font-size: 14px; color: #666; margin-bottom: 20px; font-style: italic; }

        @media (max-width: 1024px) {
          .journal-wrap { grid-template-columns: 1fr; padding: 40px 20px; }
          .journal-title { font-size: 38px; }
          .journal-content { font-size: 18px; }
          .journal-content blockquote { margin: 40px 0; padding: 0 20px; }
        }
      `}),i.jsx(u.Z,{session:r}),i.jsx(p.Z,{}),i.jsx(f.Z,{customText:"Pusat informasi dan berita kegiatan Generasi Penerus Jakarta Barat 2. Punya karya tulis atau info kegiatan terbaru? Yuk, kontribusi! Hubungi Admin untuk memuat artikel atau berita Kamu di sini."}),i.jsx("main",{style:{background:"#fff"},children:(0,i.jsxs)("div",{className:"journal-wrap",children:[(0,i.jsxs)("article",{className:"journal-body",children:[(0,i.jsxs)("header",{className:"journal-header",children:[(0,i.jsxs)("span",{className:"journal-cat",children:[a.tipe," / Vol. ",new Date().getFullYear()]}),i.jsx("h1",{className:"journal-title",children:a.judul}),(0,i.jsxs)("div",{className:"journal-meta",children:[(0,i.jsxs)("div",{className:"author-info",children:["Oleh ",i.jsx("span",{className:"author-name",children:h?.name||"Redaksi JB2.ID"})]}),i.jsx("div",{children:a.publishedAt?new Date(a.publishedAt).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}):"-"})]}),r&&(["admin","pengurus_daerah","kmm_daerah"].includes(r.role)||r.userId===a.authorId)&&(0,i.jsxs)("div",{className:"journal-actions",style:{marginTop:20},children:[i.jsx(c.default,{href:"/admin/artikel",className:"j-btn",children:"Index"}),i.jsx(c.default,{href:`/artikel/${t}/edit`,className:"j-btn j-btn-dark",children:"Edit Script"})]})]}),a.coverImage&&i.jsx("div",{className:"journal-cover-wrap",children:i.jsx("img",{src:a.coverImage,alt:a.judul,className:"journal-cover"})}),(0,i.jsxs)("div",{className:"journal-content",children:[a.ringkasan&&i.jsx("blockquote",{children:a.ringkasan}),i.jsx("div",{style:{whiteSpace:"pre-wrap"},children:a.konten})]})]}),(0,i.jsxs)("aside",{className:"journal-sidebar",children:[(0,i.jsxs)("div",{className:"sidebar-section",children:[i.jsx("h3",{className:"sidebar-hd",children:"berita"===a.tipe?"Berita Terkait":"Artikel Terkait"}),i.jsx("div",{className:"related-list",children:x.map(e=>(0,i.jsxs)(c.default,{href:`/artikel/${e.id}`,className:"j-related-card",children:[i.jsx("span",{className:"j-related-cat",children:"Digital Journal"}),i.jsx("h4",{className:"j-related-title",children:e.judul}),i.jsx("div",{style:{fontSize:12,color:"#999",fontStyle:"italic",fontFamily:"Merriweather"},children:e.publishedAt?new Date(e.publishedAt).toLocaleDateString("id-ID",{month:"short",year:"numeric"}):"-"})]},e.id))})]}),(0,i.jsxs)("div",{className:"j-cta",children:[i.jsx("h3",{className:"j-cta-hd",children:"Kontribusi Jurnal"}),i.jsx("p",{className:"j-cta-txt",children:"Kami menerima artikel ilmiah, opini, dan berita inspiratif dari seluruh generus."}),i.jsx(c.default,{href:"/login",className:"j-btn j-btn-dark",style:{display:"block"},children:"Kirim Naskah"})]})]})]})}),i.jsx("footer",{className:"footer",children:(0,i.jsxs)("div",{className:"wrap",children:[(0,i.jsxs)("div",{className:"footer-main",children:[(0,i.jsxs)("div",{children:[i.jsx("span",{className:"footer-logo-name",children:"JB2.ID"}),i.jsx("p",{className:"footer-desc",children:"Portal berita dan sistem manajemen digital resmi Generasi Penerus PC LDII Jakarta Barat 2. Membangun generasi Profesional yang Religius."})]}),(0,i.jsxs)("div",{children:[i.jsx("div",{className:"footer-col-hd",children:"Navigasi"}),i.jsx(c.default,{href:"/",className:"footer-link",children:"Beranda"}),i.jsx(c.default,{href:"/#artikel",className:"footer-link",children:"Artikel"}),i.jsx(c.default,{href:"/#berita",className:"footer-link",children:"Berita"})]}),(0,i.jsxs)("div",{children:[i.jsx("div",{className:"footer-col-hd",children:"Lokasi"}),i.jsx(c.default,{href:"https://share.google/GsGIX55kXxJnpXWIu",className:"footer-link",children:"Masjid Baitul Muttaqin"})]}),(0,i.jsxs)("div",{children:[i.jsx("div",{className:"footer-col-hd",children:"Organisasi"}),i.jsx(c.default,{href:"/#profile",className:"footer-link",children:"Profil Anggota"}),i.jsx(c.default,{href:"/#kegiatan",className:"footer-link",children:"Kegiatan"})]})]}),i.jsx("hr",{className:"footer-sep"}),(0,i.jsxs)("div",{className:"footer-bottom",children:[i.jsx("span",{className:"footer-copy",children:"\xa9 2026 JB2.ID — Hak Cipta Dilindungi"}),(0,i.jsxs)("div",{className:"footer-bottom-right",children:[i.jsx("span",{className:"footer-bottom-link",children:"Kebijakan Privasi"}),i.jsx("span",{className:"footer-bottom-link",children:"Syarat & Ketentuan"})]})]})]})})]})}n=(h.then?(await h)():h)[0],a()}catch(e){a(e)}})},41555:(e,t,r)=>{"use strict";r.d(t,{Z:()=>a});let a=(0,r(68570).createProxy)(String.raw`C:\Users\ASUS\OneDrive\Documents\Xampp1\htdocs\mudamudicengkareng\components\NewsTicker.tsx#default`)},57371:(e,t,r)=>{"use strict";r.d(t,{default:()=>i.a});var a=r(670),i=r.n(a)},58585:(e,t,r)=>{"use strict";var a=r(61085);r.o(a,"notFound")&&r.d(t,{notFound:function(){return a.notFound}}),r.o(a,"redirect")&&r.d(t,{redirect:function(){return a.redirect}})},61085:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{ReadonlyURLSearchParams:function(){return s},RedirectType:function(){return a.RedirectType},notFound:function(){return i.notFound},permanentRedirect:function(){return a.permanentRedirect},redirect:function(){return a.redirect}});let a=r(83953),i=r(16399);class n extends Error{constructor(){super("Method unavailable on `ReadonlyURLSearchParams`. Read more: https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams")}}class s extends URLSearchParams{append(){throw new n}delete(){throw new n}set(){throw new n}sort(){throw new n}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},16399:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{isNotFoundError:function(){return i},notFound:function(){return a}});let r="NEXT_NOT_FOUND";function a(){let e=Error(r);throw e.digest=r,e}function i(e){return"object"==typeof e&&null!==e&&"digest"in e&&e.digest===r}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},8586:(e,t)=>{"use strict";var r;Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"RedirectStatusCode",{enumerable:!0,get:function(){return r}}),function(e){e[e.SeeOther=303]="SeeOther",e[e.TemporaryRedirect=307]="TemporaryRedirect",e[e.PermanentRedirect=308]="PermanentRedirect"}(r||(r={})),("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},83953:(e,t,r)=>{"use strict";var a;Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{RedirectType:function(){return a},getRedirectError:function(){return l},getRedirectStatusCodeFromError:function(){return m},getRedirectTypeFromError:function(){return f},getURLFromRedirectError:function(){return p},isRedirectError:function(){return u},permanentRedirect:function(){return c},redirect:function(){return d}});let i=r(54580),n=r(72934),s=r(8586),o="NEXT_REDIRECT";function l(e,t,r){void 0===r&&(r=s.RedirectStatusCode.TemporaryRedirect);let a=Error(o);a.digest=o+";"+t+";"+e+";"+r+";";let n=i.requestAsyncStorage.getStore();return n&&(a.mutableCookies=n.mutableCookies),a}function d(e,t){void 0===t&&(t="replace");let r=n.actionAsyncStorage.getStore();throw l(e,t,(null==r?void 0:r.isAction)?s.RedirectStatusCode.SeeOther:s.RedirectStatusCode.TemporaryRedirect)}function c(e,t){void 0===t&&(t="replace");let r=n.actionAsyncStorage.getStore();throw l(e,t,(null==r?void 0:r.isAction)?s.RedirectStatusCode.SeeOther:s.RedirectStatusCode.PermanentRedirect)}function u(e){if("object"!=typeof e||null===e||!("digest"in e)||"string"!=typeof e.digest)return!1;let[t,r,a,i]=e.digest.split(";",4),n=Number(i);return t===o&&("replace"===r||"push"===r)&&"string"==typeof a&&!isNaN(n)&&n in s.RedirectStatusCode}function p(e){return u(e)?e.digest.split(";",3)[2]:null}function f(e){if(!u(e))throw Error("Not a redirect error");return e.digest.split(";",2)[1]}function m(e){if(!u(e))throw Error("Not a redirect error");return Number(e.digest.split(";",4)[3])}(function(e){e.push="push",e.replace="replace"})(a||(a={})),("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},670:(e,t,r)=>{"use strict";let{createProxy:a}=r(68570);e.exports=a("C:\\Users\\ASUS\\OneDrive\\Documents\\Xampp1\\htdocs\\mudamudicengkareng\\node_modules\\next\\dist\\client\\link.js")}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[9276,7053,8840,2772,434,8712,9487,9044],()=>r(27546));module.exports=a})();