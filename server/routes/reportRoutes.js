// // server/routes/reportRoutes.js
// import express from "express";
// import fs from "fs";
// import path from "path";
// import moment from "moment";
// import ExcelJS from "exceljs";
// import PdfPrinter from "pdfmake";
// import pdfFonts from "pdfmake/build/vfs_fonts.js";

// import User from "../models/userModel.js";
// import Booking from "../models/Bookings.js";
// import Movie from "../models/Movie.js";

// const router = express.Router();

// /* -----------------------------
//    PDF Fonts & Logo handling
//    ----------------------------- */
// const detectVFS = (m) => m?.pdfMake?.vfs || m?.vfs || m?.default?.pdfMake?.vfs || m?.default?.vfs || null;
// const vfs = detectVFS(pdfFonts);

// const getFontsMapping = () => {
//   if (vfs) {
//     const load = (n) => {
//       const file = vfs[n] || vfs[n.replace(".ttf", "")];
//       return file ? Buffer.from(file, "base64") : null;
//     };
//     return {
//       Roboto: {
//         normal: load("Roboto-Regular.ttf"),
//         bold: load("Roboto-Medium.ttf") || load("Roboto-Bold.ttf"),
//         italics: load("Roboto-Italic.ttf"),
//         bolditalics: load("Roboto-MediumItalic.ttf"),
//       },
//     };
//   }
//   // Best-effort fallback - system fonts (Windows)
//   try {
//     return {
//       Roboto: {
//         normal: fs.readFileSync("C:/Windows/Fonts/arial.ttf"),
//         bold: fs.readFileSync("C:/Windows/Fonts/arialbd.ttf"),
//         italics: fs.readFileSync("C:/Windows/Fonts/ariali.ttf"),
//         bolditalics: fs.readFileSync("C:/Windows/Fonts/arialbi.ttf"),
//       },
//     };
//   } catch (err) {
//     console.error("Font fallback failed:", err.message || err);
//     throw new Error("No fonts available for PDF generation (install pdfmake vfs or system fonts).");
//   }
// };

// const printer = new PdfPrinter(getFontsMapping());

// const loadLogoBase64 = () => {
//   try {
//     const envPath = process.env.REPORT_LOGO_PATH;
//     const logoPath = envPath || path.join(process.cwd(), "uploads", "logo.png");
//     if (fs.existsSync(logoPath)) {
//       const buf = fs.readFileSync(logoPath);
//       const ext = path.extname(logoPath).replace(".", "") || "png";
//       return `data:image/${ext};base64,${buf.toString("base64")}`;
//     }
//   } catch (e) {
//     console.warn("Logo load failed:", e.message || e);
//   }
//   return null;
// };
// const logoBase64 = loadLogoBase64();

// /* -----------------------------
//    Date filter helper (?from & ?to)
//    ----------------------------- */
// const buildDateFilter = (req) => {
//   const { from, to } = req.query;
//   if (!from && !to) return {};
//   const createdAt = {};
//   if (from) { const f = new Date(from); f.setHours(0,0,0,0); createdAt.$gte = f; }
//   if (to) { const t = new Date(to); t.setHours(23,59,59,999); createdAt.$lte = t; }
//   return Object.keys(createdAt).length ? { createdAt } : {};
// };

// /* ==================================================
//    Utility: auto-fit column widths for pdfmake table
//    - use "auto" for numeric/short cells, "*" for long text cells
//    - here we use sensible defaults; pdfmake will auto-page
//    ================================================== */
// const tableWidthsAuto = (cols) => cols.map(c => {
//   // if column key suggests long text -> star
//   const longKeys = ["movie", "email", "seats", "bookedSeats", "title"];
//   if (longKeys.some(k => c.toLowerCase().includes(k))) return "*";
//   // otherwise small fixed / auto
//   return "auto";
// });

// /* ======================
//    USERS EXCEL / PDF
//    ====================== */
// router.get("/users/excel", async (req, res) => {
//   try {
//     const filter = buildDateFilter(req);
//     const users = await User.find(filter).sort({ createdAt: -1 });

//     const wb = new ExcelJS.Workbook();
//     const sh = wb.addWorksheet("Users");
//     sh.columns = [
//       { header: "Sr", key: "sr", width: 6 },
//       { header: "Name", key: "name", width: 30 },
//       { header: "Email", key: "email", width: 40 },
//       { header: "Created", key: "created", width: 18 },
//     ];

//     users.forEach((u,i) => sh.addRow({
//       sr: i+1,
//       name: u.name || "N/A",
//       email: u.email || "N/A",
//       created: u.createdAt ? moment(u.createdAt).format("DD-MM-YYYY") : "N/A"
//     }));

//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//     res.setHeader("Content-Disposition", `attachment; filename=users-${Date.now()}.xlsx`);
//     await wb.xlsx.write(res);
//     res.end();
//   } catch (err) {
//     console.error("Users Excel Error:", err);
//     res.status(500).send("Failed to generate users excel");
//   }
// });

// router.get("/users/pdf", async (req, res) => {
//   try {
//     const filter = buildDateFilter(req);
//     const users = await User.find(filter).sort({ createdAt: -1 });

//     const body = [
//       [{ text: "Sr", style:"th", alignment:"center" }, { text:"Name", style:"th" }, { text:"Email", style:"th" }, { text:"Created", style:"th", alignment:"center" }]
//     ];

//     users.forEach((u,i) => body.push([
//       { text: i+1, alignment:"center" },
//       { text: u.name || "N/A", noWrap:false },
//       { text: u.email || "N/A", noWrap:false },
//       { text: u.createdAt ? moment(u.createdAt).format("DD-MM-YYYY") : "N/A", alignment:"center" }
//     ]));

//     const docDef = {
//       pageSize: "A4",
//       pageMargins: [30, 100, 30, 60],
//       images: logoBase64 ? { logo: logoBase64 } : {},
//       header: (cp, pc) => ({
//         columns: [
//           logoBase64 ? { image: "logo", width: 70, margin:[30,10,0,10] } : { text:"", width:70 },
//           { text: "QUICKSHOW — Users Report", style:"headerTitle", alignment:"center" },
//           { text: `Page ${cp} / ${pc}`, alignment:"right", margin:[0,10,30,0] }
//         ]
//       }),
//       footer: (cp,pc) => ({ columns:[
//         { text: `QuickShow © ${new Date().getFullYear()}`, alignment:"left", margin:[30,0] },
//         { text: `Generated: ${moment().format("DD-MM-YYYY HH:mm")}`, alignment:"center" },
//         { text: `Page ${cp} of ${pc}`, alignment:"right", margin:[0,0,30,0] }
//       ], margin:[0,8,0,0] }),
//       content: [
//         { text: `Report Range: ${req.query.from || "ALL"} → ${req.query.to || "ALL"}`, style:"meta", margin:[0,0,0,8] },
//         {
//           table: {
//             headerRows: 1,
//             widths: tableWidthsAuto(["sr","name","email","created"]),
//             body
//           },
//           layout: {
//             fillColor: (ri) => ri === 0 ? "#b91c1c" : ri % 2 === 0 ? "#fff5f5" : null,
//             hLineColor: ()=>"#f3e5e5",
//             vLineColor: ()=>"#f3e5e5",
//             paddingLeft: ()=>8,
//             paddingRight: ()=>8,
//             paddingTop: ()=>6,
//             paddingBottom: ()=>6
//           }
//         }
//       ],
//       styles: {
//         headerTitle: { fontSize: 16, bold: true, color: "#b91c1c" }, // red cinematic
//         meta: { fontSize: 9, color: "#6b7280" },
//         th: { bold: true, color: "white", fillColor: "#b91c1c" }
//       },
//       defaultStyle: { font: "Roboto", fontSize: 10 }
//     };

//     const pdfDoc = printer.createPdfKitDocument(docDef);
//     res.setHeader("Content-Type","application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=users-${Date.now()}.pdf`);
//     pdfDoc.pipe(res); pdfDoc.end();
//   } catch (err) {
//     console.error("Users PDF Error:", err);
//     res.status(500).send("Failed to generate users pdf");
//   }
// });

// /* ===========================
//    BOOKINGS Excel / PDF
//    =========================== */
// router.get("/bookings/excel", async (req,res) => {
//   try {
//     const filter = buildDateFilter(req);
//     const bookings = await Booking.find(filter)
//       .populate("user","name email")
//       .populate({ path:"show", populate:{ path:"movie", model:"Movie", select:"title" } })
//       .sort({ createdAt:-1 });

//     const wb = new ExcelJS.Workbook();
//     const sh = wb.addWorksheet("Bookings");
//     sh.columns = [
//       { header:"Sr", key:"sr", width:6 },
//       { header:"User", key:"user", width:25 },
//       { header:"Email", key:"email", width:30 },
//       { header:"Movie", key:"movie", width:40 },
//       { header:"Theater", key:"theater", width:18 },
//       { header:"Date", key:"date", width:14 },
//       { header:"ShowTime", key:"showTime", width:18 },
//       { header:"Amount", key:"amount", width:12 },
//       { header:"Seats", key:"seats", width:30 },
//       { header:"Created", key:"created", width:18 },
//     ];

//     bookings.forEach((b,i) => sh.addRow({
//       sr: i+1,
//       user: b.user?.name || "N/A",
//       email: b.user?.email || "N/A",
//       movie: b.show?.movie?.title || "N/A",
//       theater: b.theater || "N/A",
//       date: b.date ? moment(b.date).format("DD-MM-YYYY") : "N/A",
//       showTime: b.showTime ? moment(b.showTime).format("DD-MM-YYYY HH:mm") : "N/A",
//       amount: b.amount != null ? b.amount : "N/A",
//       seats: Array.isArray(b.bookedSeats) ? b.bookedSeats.join(", ") : (b.bookedSeats || ""),
//       created: b.createdAt ? moment(b.createdAt).format("DD-MM-YYYY") : "N/A"
//     }));

//     res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//     res.setHeader("Content-Disposition", `attachment; filename=bookings-${Date.now()}.xlsx`);
//     await wb.xlsx.write(res); res.end();
//   } catch (err) {
//     console.error("Bookings Excel Error:", err);
//     res.status(500).send("Failed to generate bookings excel");
//   }
// });

// router.get("/bookings/pdf", async (req,res) => {
//   try {
//     const filter = buildDateFilter(req);
//     const bookings = await Booking.find(filter)
//       .populate("user","name email")
//       .populate({ path:"show", populate:{ path:"movie", model:"Movie", select:"title date" } })
//       .sort({ createdAt:-1 });

//     const body = [
//       [{ text:"Sr", style:"th", alignment:"center" },
//        { text:"User", style:"th" },
//        { text:"Email", style:"th" },
//        { text:"Movie", style:"th" },
//        { text:"Theater", style:"th", alignment:"center" },
//        { text:"Date", style:"th", alignment:"center" },
//        { text:"Show Time", style:"th", alignment:"center" },
//        { text:"Amount", style:"th", alignment:"right" },
//        { text:"Seats", style:"th" }]
//     ];

//     bookings.forEach((b,i) => {
//       const fd = b.date ? moment(b.date).format("DD-MM-YYYY") : "N/A";
//       const fs = b.showTime ? moment(b.showTime).format("DD-MM-YYYY HH:mm") : "N/A";
//       body.push([
//         { text:i+1, alignment:"center" },
//         { text: b.user?.name || "N/A", noWrap:false },
//         { text: b.user?.email || "N/A", noWrap:false },
//         { text: b.show?.movie?.title || "N/A", noWrap:false },
//         { text: b.theater || "N/A", alignment:"center" },
//         { text: fd, alignment:"center" },
//         { text: fs, alignment:"center" },
//         { text: b.amount != null ? `₹${b.amount}` : "N/A", alignment:"right" },
//         { text: Array.isArray(b.bookedSeats) ? b.bookedSeats.join(", ") : (b.bookedSeats || "N/A"), noWrap:false }
//       ]);
//     });

//     const docDef = {
//       pageSize:"A4",
//       pageOrientation:"landscape",
//       pageMargins:[18,110,18,60],
//       images: logoBase64 ? { logo: logoBase64 } : {},
//       header: (cp,pc) => ({
//         columns:[
//           logoBase64 ? { image:"logo", width:90, margin:[18,8,0,8] } : { text:"", width:90 },
//           { text: "QUICKSHOW — Bookings Report", style:"headerTitle", alignment:"center" },
//           { text:`Page ${cp} / ${pc}`, alignment:"right", margin:[0,10,18,0] }
//         ]
//       }),
//       footer: (cp,pc) => ({ columns:[
//         { text:`QuickShow © ${new Date().getFullYear()}`, alignment:"left", margin:[18,0] },
//         { text: `Generated: ${moment().format("DD-MM-YYYY HH:mm")}`, alignment:"center" },
//         { text:`Page ${cp} of ${pc}`, alignment:"right", margin:[0,0,18,0] }
//       ], margin:[0,8,0,0] }),
//       content:[
//         {
//           table:{
//             headerRows:1,
//             widths: tableWidthsAuto(["sr","user","email","movie","theater","date","showtime","amount","seats"]),
//             body
//           },
//           layout:{
//             fillColor:(ri)=> ri===0 ? "#b91c1c" : ri%2===0 ? "#fff5f5" : null,
//             hLineColor:()=>"#f3e5e5",
//             vLineColor:()=>"#f3e5e5",
//             paddingLeft:()=>8,
//             paddingRight:()=>8,
//             paddingTop:()=>6,
//             paddingBottom:()=>6
//           }
//         }
//       ],
//       styles:{
//         headerTitle:{ fontSize:18, bold:true, color:"#b91c1c" },
//         th:{ bold:true, color:"white", fillColor:"#b91c1c" }
//       },
//       defaultStyle:{ font:"Roboto", fontSize:9 }
//     };

//     const pdfDoc = printer.createPdfKitDocument(docDef);
//     res.setHeader("Content-Type","application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=bookings-${Date.now()}.pdf`);
//     pdfDoc.pipe(res); pdfDoc.end();
//   } catch (err) {
//     console.error("Bookings PDF Error:", err);
//     res.status(500).send("Failed to generate bookings pdf");
//   }
// });

// /* ===========================
//    MOVIE-WISE REVENUE (Excel + PDF)
//    =========================== */
// router.get("/movies/revenue/excel", async (req,res) => {
//   try {
//     const filter = buildDateFilter(req);

//     const pipeline = [
//       { $match: filter },
//       { $lookup: { from:"shows", localField:"show", foreignField:"_id", as:"showDoc" } },
//       { $unwind: { path:"$showDoc", preserveNullAndEmptyArrays:true } },
//       { $lookup: { from:"movies", localField:"showDoc.movie", foreignField:"_id", as:"movieDoc" } },
//       { $unwind: { path:"$movieDoc", preserveNullAndEmptyArrays:true } },
//       { $project: {
//           movieId: "$movieDoc._id",
//           title: "$movieDoc.title",
//           amount: { $ifNull:["$amount",0] },
//           seatsCount: { $size: { $ifNull:["$bookedSeats",[]] } },
//           showId: "$showDoc._id",
//           showDate: "$showDoc.date"
//         }
//       },
//       { $group: {
//           _id: "$movieId",
//           title: { $first: "$title" },
//           totalBookings: { $sum: 1 },
//           totalSeats: { $sum: "$seatsCount" },
//           totalRevenue: { $sum: "$amount" },
//           shows: { $addToSet: "$showId" },
//           lastShowDate: { $max: "$showDate" }
//         }
//       },
//       { $project: {
//           title:1, totalBookings:1, totalSeats:1, totalRevenue:1,
//           avgRevenuePerShow: { $cond: [{ $gt:[{ $size:"$shows" },0]}, { $divide:["$totalRevenue",{ $size:"$shows" }] }, 0 ] },
//           lastShowDate:1
//         }
//       },
//       { $sort: { totalRevenue:-1 } }
//     ];

//     const results = await Booking.aggregate(pipeline);

//     const wb = new ExcelJS.Workbook();
//     const sh = wb.addWorksheet("Movie Revenue");
//     sh.columns = [
//       { header:"Sr", key:"sr", width:6 },
//       { header:"Movie", key:"movie", width:40 },
//       { header:"Total Bookings", key:"totalBookings", width:16 },
//       { header:"Total Seats", key:"totalSeats", width:12 },
//       { header:"Total Revenue (₹)", key:"totalRevenue", width:18 },
//       { header:"Avg Revenue / Show (₹)", key:"avgRevenue", width:18 },
//       { header:"Last Show Date", key:"lastShow", width:16 }
//     ];

//     results.forEach((r,i) => sh.addRow({
//       sr:i+1,
//       movie: r.title || "N/A",
//       totalBookings: r.totalBookings || 0,
//       totalSeats: r.totalSeats || 0,
//       totalRevenue: r.totalRevenue != null ? r.totalRevenue : 0,
//       avgRevenue: r.avgRevenuePerShow != null ? Number(r.avgRevenuePerShow).toFixed(2) : "0.00",
//       lastShow: r.lastShowDate ? moment(r.lastShowDate).format("DD-MM-YYYY") : "N/A"
//     }));

//     res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//     res.setHeader("Content-Disposition", `attachment; filename=movie-revenue-${Date.now()}.xlsx`);
//     await wb.xlsx.write(res); res.end();
//   } catch (err) {
//     console.error("Movie Revenue Excel Error:", err);
//     res.status(500).send("Failed to generate movie revenue excel");
//   }
// });

// router.get("/movies/revenue/pdf", async (req,res) => {
//   try {
//     const filter = buildDateFilter(req);

//     const pipeline = [
//       { $match: filter },
//       { $lookup: { from:"shows", localField:"show", foreignField:"_id", as:"showDoc" } },
//       { $unwind: { path:"$showDoc", preserveNullAndEmptyArrays:true } },
//       { $lookup: { from:"movies", localField:"showDoc.movie", foreignField:"_id", as:"movieDoc" } },
//       { $unwind: { path:"$movieDoc", preserveNullAndEmptyArrays:true } },
//       { $project: {
//           movieId: "$movieDoc._id",
//           title: "$movieDoc.title",
//           amount: { $ifNull:["$amount",0] },
//           seatsCount: { $size: { $ifNull:["$bookedSeats",[]] } },
//           showId: "$showDoc._id",
//           showDate: "$showDoc.date"
//         }
//       },
//       { $group: {
//           _id: "$movieId",
//           title: { $first: "$title" },
//           totalBookings: { $sum: 1 },
//           totalSeats: { $sum: "$seatsCount" },
//           totalRevenue: { $sum: "$amount" },
//           shows: { $addToSet: "$showId" },
//           lastShowDate: { $max: "$showDate" }
//         }
//       },
//       { $project: {
//           title:1, totalBookings:1, totalSeats:1, totalRevenue:1,
//           avgRevenuePerShow: { $cond: [{ $gt:[{ $size:"$shows" },0]}, { $divide:["$totalRevenue",{ $size:"$shows" }] }, 0 ] },
//           lastShowDate:1
//         }
//       },
//       { $sort: { totalRevenue:-1 } }
//     ];

//     const results = await Booking.aggregate(pipeline);

//     const body = [
//       [{ text:"Sr", style:"th", alignment:"center" },
//        { text:"Movie", style:"th" },
//        { text:"Total Bookings", style:"th", alignment:"center" },
//        { text:"Total Seats", style:"th", alignment:"center" },
//        { text:"Total Revenue (₹)", style:"th", alignment:"right" },
//        { text:"Avg / Show (₹)", style:"th", alignment:"right" },
//        { text:"Last Show", style:"th", alignment:"center" }]
//     ];

//     results.forEach((r,i) => body.push([
//       { text: i+1, alignment:"center" },
//       { text: r.title || "N/A", noWrap:false },
//       { text: r.totalBookings != null ? r.totalBookings : 0, alignment:"center" },
//       { text: r.totalSeats != null ? r.totalSeats : 0, alignment:"center" },
//       { text: r.totalRevenue != null ? `₹${r.totalRevenue}` : "₹0", alignment:"right" },
//       { text: r.avgRevenuePerShow != null ? `₹${Number(r.avgRevenuePerShow).toFixed(2)}` : "₹0.00", alignment:"right" },
//       { text: r.lastShowDate ? moment(r.lastShowDate).format("DD-MM-YYYY") : "N/A", alignment:"center" }
//     ]));

//     const totalRevenue = results.reduce((s, r) => s + (r.totalRevenue || 0), 0);

//     const docDef = {
//       pageSize:"A4",
//       pageOrientation:"portrait",
//       pageMargins:[28,110,28,60],
//       images: logoBase64 ? { logo: logoBase64 } : {},
//       header: (cp,pc) => ({
//         columns:[
//           logoBase64 ? { image:"logo", width:80, margin:[28,10,0,10] } : { text:"", width:80 },
//           { text: "QUICKSHOW — Movie Revenue", style:"headerTitle", alignment:"center" },
//           { text:`Page ${cp} / ${pc}`, alignment:"right", margin:[0,10,28,0] }
//         ]
//       }),
//       footer: (cp,pc) => ({ columns:[
//         { text:`Generated: ${moment().format("DD-MM-YYYY HH:mm")}`, alignment:"left", margin:[28,0] },
//         { text:`QuickShow © ${new Date().getFullYear()}`, alignment:"center" },
//         { text:`Page ${cp} of ${pc}`, alignment:"right", margin:[0,0,28,0] }
//       ], margin:[0,8,0,0] }),
//       content:[
//         { text: `Summary: Movies: ${results.length}  •  Total Revenue: ₹${totalRevenue.toLocaleString("en-IN")}`, style:"summary", margin:[0,0,0,8] },
//         {
//           table:{
//             headerRows:1,
//             widths: tableWidthsAuto(["sr","movie","totalBookings","totalSeats","totalRevenue","avgRevenue","lastShow"]),
//             body
//           },
//           layout:{
//             fillColor:(ri)=> ri===0 ? "#b91c1c" : ri%2===0 ? "#fff5f5" : null,
//             hLineColor:()=>"#f3e5e5",
//             vLineColor:()=>"#f3e5e5",
//             paddingLeft:()=>8,
//             paddingRight:()=>8,
//             paddingTop:()=>6,
//             paddingBottom:()=>6
//           }
//         }
//       ],
//       styles:{
//         headerTitle:{ fontSize:16, bold:true, color:"#b91c1c" },
//         summary:{ fontSize:10, color:"#374151" },
//         th:{ bold:true, color:"white", fillColor:"#b91c1c" }
//       },
//       defaultStyle:{ font:"Roboto", fontSize:10 }
//     };

//     const pdfDoc = printer.createPdfKitDocument(docDef);
//     res.setHeader("Content-Type","application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=movie-revenue-${Date.now()}.pdf`);
//     pdfDoc.pipe(res); pdfDoc.end();
//   } catch (err) {
//     console.error("Movie Revenue PDF Error:", err);
//     res.status(500).send("Failed to generate movie revenue pdf");
//   }
// });

// export default router;

// server/routes/reportRoutes.js
// server/routes/reportRoutes.js
import express from "express";
import fs from "fs";
import path from "path";
import moment from "moment";
import ExcelJS from "exceljs";

import PdfPrinter from "pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts.js"; // built-in virtual fonts (VFS)

import User from "../models/userModel.js";
import Booking from "../models/Bookings.js";
import Movie from "../models/Movie.js";

const router = express.Router();

/* ----------------------------------------------------
   PDFMAKE VFS / FONT FIX (works on Railway & Linux)
---------------------------------------------------- */
pdfFonts.pdfMake = pdfFonts.pdfMake || {};
const vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || pdfFonts;

const getFontsMapping = () => {
  if (vfs) {
    const load = (n) => {
      const file = vfs[n] || vfs[n.replace(".ttf", "")];
      return file ? Buffer.from(file, "base64") : null;
    };
    return {
      Roboto: {
        normal: load("Roboto-Regular.ttf"),
        bold: load("Roboto-Medium.ttf") || load("Roboto-Bold.ttf"),
        italics: load("Roboto-Italic.ttf"),
        bolditalics: load("Roboto-MediumItalic.ttf"),
      },
    };
  }
  return {};
};

const printer = new PdfPrinter(getFontsMapping());

/* -----------------------------
   Logo handling (optional)
----------------------------- */
const loadLogoBase64 = () => {
  try {
    const envPath = process.env.REPORT_LOGO_PATH;
    const logoPath = envPath || path.join(process.cwd(), "uploads", "logo.png");
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      const ext = path.extname(logoPath).replace(".", "") || "png";
      return `data:image/${ext};base64,${buf.toString("base64")}`;
    }
  } catch (e) {
    console.warn("Logo load failed:", e.message || e);
  }
  return null;
};
const logoBase64 = loadLogoBase64();

/* -----------------------------
   Date filter helper (?from & ?to)
----------------------------- */
const buildDateFilter = (req) => {
  const { from, to } = req.query;
  if (!from && !to) return {};
  const createdAt = {};
  if (from) {
    const f = new Date(from);
    f.setHours(0, 0, 0, 0);
    createdAt.$gte = f;
  }
  if (to) {
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    createdAt.$lte = t;
  }
  return Object.keys(createdAt).length ? { createdAt } : {};
};

/* -----------------------------
   Table widths helper for pdfmake
----------------------------- */
const tableWidthsAuto = (cols) =>
  cols.map((c) => {
    const longKeys = ["movie", "email", "seats", "bookedSeats", "title"];
    return longKeys.some((k) => c.toLowerCase().includes(k)) ? "*" : "auto";
});

/* ===========================
   USERS: EXCEL
   GET /users/excel
   =========================== */
router.get("/users/excel", async (req, res) => {
  try {
    const filter = buildDateFilter(req);
    const users = await User.find(filter).sort({ createdAt: -1 });

    const wb = new ExcelJS.Workbook();
    const sh = wb.addWorksheet("Users");
    sh.columns = [
      { header: "Sr", key: "sr", width: 6 },
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 40 },
      { header: "Created", key: "created", width: 18 },
    ];

    users.forEach((u, i) =>
      sh.addRow({
        sr: i + 1,
        name: u.name || "N/A",
        email: u.email || "N/A",
        created: u.createdAt ? moment(u.createdAt).format("DD-MM-YYYY") : "N/A",
      })
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users-${Date.now()}.xlsx`
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Users Excel Error:", err);
    res.status(500).send("Failed to generate users excel");
  }
});

/* ===========================
   USERS: PDF
   GET /users/pdf
   =========================== */
router.get("/users/pdf", async (req, res) => {
  try {
    const filter = buildDateFilter(req);
    const users = await User.find(filter).sort({ createdAt: -1 });

    const body = [
      [
        { text: "Sr", style: "th", alignment: "center" },
        { text: "Name", style: "th" },
        { text: "Email", style: "th" },
        { text: "Created", style: "th", alignment: "center" },
      ],
    ];

    users.forEach((u, i) =>
      body.push([
        { text: i + 1, alignment: "center" },
        { text: u.name || "N/A" },
        { text: u.email || "N/A" },
        {
          text: u.createdAt ? moment(u.createdAt).format("DD-MM-YYYY") : "N/A",
          alignment: "center",
        },
      ])
    );

    const docDef = {
      pageSize: "A4",
      pageMargins: [30, 100, 30, 60],
      images: logoBase64 ? { logo: logoBase64 } : {},
      header: (cp, pc) => ({
        columns: [
          logoBase64 ? { image: "logo", width: 70, margin: [30, 10, 0, 10] } : { text: "", width: 70 },
          { text: "QUICKSHOW — Users Report", style: "headerTitle", alignment: "center" },
          { text: `Page ${cp}/${pc}`, alignment: "right", margin: [0, 10, 30, 0] },
        ],
      }),
      footer: (cp, pc) => ({
        columns: [
          { text: `QuickShow © ${new Date().getFullYear()}`, alignment: "left", margin: [30, 0] },
          { text: `Generated: ${moment().format("DD-MM-YYYY HH:mm")}`, alignment: "center" },
          { text: `Page ${cp} of ${pc}`, alignment: "right", margin: [0, 0, 30, 0] },
        ],
        margin: [0, 8, 0, 0],
      }),
      content: [
        { text: `Report Range: ${req.query.from || "ALL"} → ${req.query.to || "ALL"}`, style: "meta", margin: [0, 0, 0, 8] },
        {
          table: {
            headerRows: 1,
            widths: tableWidthsAuto(["sr", "name", "email", "created"]),
            body,
          },
          layout: {
            fillColor: (ri) => (ri === 0 ? "#b91c1c" : ri % 2 === 0 ? "#fff5f5" : null),
            hLineColor: () => "#f3e5e5",
            vLineColor: () => "#f3e5e5",
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },
      ],
      styles: {
        headerTitle: { fontSize: 16, bold: true },
        meta: { fontSize: 9, color: "#6b7280" },
        th: { bold: true, color: "white", fillColor: "#b91c1c" },
      },
      defaultStyle: { font: "Roboto", fontSize: 10 },
    };

    const pdf = printer.createPdfKitDocument(docDef);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=users-${Date.now()}.pdf`);
    pdf.pipe(res);
    pdf.end();
  } catch (err) {
    console.error("Users PDF Error:", err);
    res.status(500).send("Failed to generate users pdf");
  }
});

/* ===========================
   BOOKINGS: EXCEL
   GET /bookings/excel
   =========================== */
router.get("/bookings/excel", async (req, res) => {
  try {
    const filter = buildDateFilter(req);
    const bookings = await Booking.find(filter)
      .populate("user", "name email")
      .populate({ path: "show", populate: { path: "movie", model: "Movie", select: "title" } })
      .sort({ createdAt: -1 });

    const wb = new ExcelJS.Workbook();
    const sh = wb.addWorksheet("Bookings");
    sh.columns = [
      { header: "Sr", key: "sr", width: 6 },
      { header: "User", key: "user", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Movie", key: "movie", width: 40 },
      { header: "Theater", key: "theater", width: 18 },
      { header: "Date", key: "date", width: 14 },
      { header: "ShowTime", key: "showTime", width: 18 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Seats", key: "seats", width: 30 },
      { header: "Created", key: "created", width: 18 },
      { header: "Status", key: "status", width: 12 },
    ];

    bookings.forEach((b, i) =>
      sh.addRow({
        sr: i + 1,
        user: b.user?.name || "N/A",
        email: b.user?.email || "N/A",
        movie: b.show?.movie?.title || "N/A",
        theater: b.theater || "N/A",
        date: b.date ? moment(b.date).format("DD-MM-YYYY") : "N/A",
        showTime: b.showTime ? moment(b.showTime).format("DD-MM-YYYY HH:mm") : "N/A",
        amount: b.amount != null ? b.amount : "N/A",
        seats: Array.isArray(b.bookedSeats) ? b.bookedSeats.join(", ") : (b.bookedSeats || ""),
        created: b.createdAt ? moment(b.createdAt).format("DD-MM-YYYY") : "N/A",
        status: b.status === "cancelled" ? "CANCELLED" : b.isPaid ? "PAID" : "PENDING",
      })
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bookings-${Date.now()}.xlsx`
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Bookings Excel Error:", err);
    res.status(500).send("Failed to generate bookings excel");
  }
});

/* ===========================
   BOOKINGS: PDF
   GET /bookings/pdf
   =========================== */
router.get("/bookings/pdf", async (req, res) => {
  try {
    const filter = buildDateFilter(req);
    const bookings = await Booking.find(filter)
      .populate("user", "name email")
      .populate({ path: "show", populate: { path: "movie", model: "Movie", select: "title date" } })
      .sort({ createdAt: -1 });

    const body = [
      [
        { text: "Sr", style: "th", alignment: "center" },
        { text: "User", style: "th" },
        { text: "Email", style: "th" },
        { text: "Movie", style: "th" },
        { text: "Theater", style: "th", alignment: "center" },
        { text: "Date", style: "th", alignment: "center" },
        { text: "Show Time", style: "th", alignment: "center" },
        { text: "Amount", style: "th", alignment: "right" },
        { text: "Seats", style: "th" },
        { text: "Status", style: "th", alignment: "center" },
      ],
    ];

    bookings.forEach((b, i) => {
      const fd = b.date ? moment(b.date).format("DD-MM-YYYY") : "N/A";
      const fs = b.showTime ? moment(b.showTime).format("DD-MM-YYYY HH:mm") : "N/A";
      body.push([
        { text: i + 1, alignment: "center" },
        { text: b.user?.name || "N/A", noWrap: false },
        { text: b.user?.email || "N/A", noWrap: false },
        { text: b.show?.movie?.title || "N/A", noWrap: false },
        { text: b.theater || "N/A", alignment: "center" },
        { text: fd, alignment: "center" },
        { text: fs, alignment: "center" },
        { text: b.amount != null ? `₹${b.amount}` : "N/A", alignment: "right" },
        { text: Array.isArray(b.bookedSeats) ? b.bookedSeats.join(", ") : (b.bookedSeats || "N/A"), noWrap: false },
        { text: b.status === "cancelled" ? "CANCELLED" : b.isPaid ? "PAID" : "PENDING", alignment: "center" },
      ]);
    });

    const docDef = {
      pageSize: "A4",
      pageOrientation: "landscape",
      pageMargins: [18, 110, 18, 60],
      images: logoBase64 ? { logo: logoBase64 } : {},
      header: (cp, pc) => ({
        columns: [
          logoBase64 ? { image: "logo", width: 90, margin: [18, 8, 0, 8] } : { text: "", width: 90 },
          { text: "QUICKSHOW — Bookings Report", style: "headerTitle", alignment: "center" },
          { text: `Page ${cp} / ${pc}`, alignment: "right", margin: [0, 10, 18, 0] },
        ],
      }),
      footer: (cp, pc) => ({
        columns: [
          { text: `QuickShow © ${new Date().getFullYear()}`, alignment: "left", margin: [18, 0] },
          { text: `Generated: ${moment().format("DD-MM-YYYY HH:mm")}`, alignment: "center" },
          { text: `Page ${cp} of ${pc}`, alignment: "right", margin: [0, 0, 18, 0] },
        ],
        margin: [0, 8, 0, 0],
      }),
      content: [
        {
          table: {
            headerRows: 1,
            widths: tableWidthsAuto(["sr", "user", "email", "movie", "theater", "date", "showtime", "amount", "seats", "status"]),
            body,
          },
          layout: {
            fillColor: (ri) => (ri === 0 ? "#b91c1c" : ri % 2 === 0 ? "#fff5f5" : null),
            hLineColor: () => "#f3e5e5",
            vLineColor: () => "#f3e5e5",
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },
      ],
      styles: {
        headerTitle: { fontSize: 18, bold: true, color: "#b91c1c" },
        th: { bold: true, color: "white", fillColor: "#b91c1c" },
      },
      defaultStyle: { font: "Roboto", fontSize: 9 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDef);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=bookings-${Date.now()}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error("Bookings PDF Error:", err);
    res.status(500).send("Failed to generate bookings pdf");
  }
});

/* ================================
   MOVIE-WISE REVENUE: EXCEL
   GET /movies/revenue/excel
   ================================ */
router.get("/movies/revenue/excel", async (req, res) => {
  try {
    const filter = buildDateFilter(req);

    const pipeline = [
      { $match: filter },
      { $lookup: { from: "shows", localField: "show", foreignField: "_id", as: "showDoc" } },
      { $unwind: { path: "$showDoc", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "movies", localField: "showDoc.movie", foreignField: "_id", as: "movieDoc" } },
      { $unwind: { path: "$movieDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          movieId: "$movieDoc._id",
          title: "$movieDoc.title",
          amount: { $ifNull: ["$amount", 0] },
          seatsCount: { $size: { $ifNull: ["$bookedSeats", []] } },
          showId: "$showDoc._id",
          showDate: "$showDoc.showDateTime",
          status: "$status",
          isPaid: "$isPaid",
        },
      },
      {
        $group: {
          _id: "$movieId",
          title: { $first: "$title" },
          confirmedBookings: {
            $sum: { $cond: [ { $and: [ { $eq: ["$isPaid", true] }, { $ne: ["$status", "cancelled"] } ] }, 1, 0 ] }
          },
          cancelledBookings: {
            $sum: { $cond: [ { $or: [ { $eq: ["$status", "cancelled"] }, { $eq: ["$isPaid", false] } ] }, 1, 0 ] }
          },
          confirmedSeats: {
            $sum: { $cond: [ { $and: [ { $eq: ["$isPaid", true] }, { $ne: ["$status", "cancelled"] } ] }, "$seatsCount", 0 ] }
          },
          cancelledSeats: {
            $sum: { $cond: [ { $or: [ { $eq: ["$status", "cancelled"] }, { $eq: ["$isPaid", false] } ] }, "$seatsCount", 0 ] }
          },
          confirmedRevenue: {
            $sum: { $cond: [ { $and: [ { $eq: ["$isPaid", true] }, { $ne: ["$status", "cancelled"] } ] }, "$amount", 0 ] }
          },
          cancelledRevenue: {
            $sum: { $cond: [ { $or: [ { $eq: ["$status", "cancelled"] }, { $eq: ["$isPaid", false] } ] }, "$amount", 0 ] }
          },
          shows: { $addToSet: "$showId" },
          lastShowDate: { $max: "$showDate" },
        },
      },
      {
        $project: {
          title: 1,
          confirmedBookings: 1,
          cancelledBookings: 1,
          confirmedSeats: 1,
          cancelledSeats: 1,
          confirmedRevenue: 1,
          cancelledRevenue: 1,
          avgRevenuePerShow: {
            $cond: [
              { $gt: [{ $size: "$shows" }, 0] },
              { $divide: ["$confirmedRevenue", { $size: "$shows" }] },
              0,
            ],
          },
          lastShowDate: 1,
        },
      },
      { $sort: { confirmedRevenue: -1 } },
    ];

    const results = await Booking.aggregate(pipeline);

    const wb = new ExcelJS.Workbook();
    const sh = wb.addWorksheet("Movie Revenue");
    sh.columns = [
      { header: "Sr", key: "sr", width: 6 },
      { header: "Movie", key: "movie", width: 40 },
      { header: "Conf. Bookings", key: "confirmedBookings", width: 18 },
      { header: "Canc. Bookings", key: "cancelledBookings", width: 18 },
      { header: "Conf. Seats", key: "confirmedSeats", width: 16 },
      { header: "Canc. Seats", key: "cancelledSeats", width: 16 },
      { header: "Conf. Revenue (₹)", key: "confirmedRevenue", width: 20 },
      { header: "Canc/Pend. Revenue (₹)", key: "cancelledRevenue", width: 25 },
      { header: "Avg / Show (₹)", key: "avgRevenue", width: 16 },
      { header: "Last Show Date", key: "lastShow", width: 16 },
    ];

    results.forEach((r, i) =>
      sh.addRow({
        sr: i + 1,
        movie: r.title || "N/A",
        confirmedBookings: r.confirmedBookings || 0,
        cancelledBookings: r.cancelledBookings || 0,
        confirmedSeats: r.confirmedSeats || 0,
        cancelledSeats: r.cancelledSeats || 0,
        confirmedRevenue: r.confirmedRevenue != null ? r.confirmedRevenue : 0,
        cancelledRevenue: r.cancelledRevenue != null ? r.cancelledRevenue : 0,
        avgRevenue: r.avgRevenuePerShow != null ? Number(r.avgRevenuePerShow).toFixed(2) : "0.00",
        lastShow: r.lastShowDate ? moment(r.lastShowDate).format("DD-MM-YYYY") : "N/A",
      })
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=movie-revenue-${Date.now()}.xlsx`
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Movie Revenue Excel Error:", err);
    res.status(500).send("Failed to generate movie revenue excel");
  }
});

/* ================================
   MOVIE-WISE REVENUE: PDF
   GET /movies/revenue/pdf
   ================================ */
router.get("/movies/revenue/pdf", async (req, res) => {
  try {
    const filter = buildDateFilter(req);

    const pipeline = [
      { $match: filter },
      { $lookup: { from: "shows", localField: "show", foreignField: "_id", as: "showDoc" } },
      { $unwind: { path: "$showDoc", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "movies", localField: "showDoc.movie", foreignField: "_id", as: "movieDoc" } },
      { $unwind: { path: "$movieDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          movieId: "$movieDoc._id",
          title: "$movieDoc.title",
          amount: { $ifNull: ["$amount", 0] },
          seatsCount: { $size: { $ifNull: ["$bookedSeats", []] } },
          showId: "$showDoc._id",
          showDate: "$showDoc.showDateTime",
          status: "$status",
          isPaid: "$isPaid",
        },
      },
      {
        $group: {
          _id: "$movieId",
          title: { $first: "$title" },
          confirmedBookings: {
            $sum: { $cond: [ { $and: [ { $eq: ["$isPaid", true] }, { $ne: ["$status", "cancelled"] } ] }, 1, 0 ] }
          },
          cancelledBookings: {
            $sum: { $cond: [ { $or: [ { $eq: ["$status", "cancelled"] }, { $eq: ["$isPaid", false] } ] }, 1, 0 ] }
          },
          confirmedSeats: {
            $sum: { $cond: [ { $and: [ { $eq: ["$isPaid", true] }, { $ne: ["$status", "cancelled"] } ] }, "$seatsCount", 0 ] }
          },
          cancelledSeats: {
            $sum: { $cond: [ { $or: [ { $eq: ["$status", "cancelled"] }, { $eq: ["$isPaid", false] } ] }, "$seatsCount", 0 ] }
          },
          confirmedRevenue: {
            $sum: { $cond: [ { $and: [ { $eq: ["$isPaid", true] }, { $ne: ["$status", "cancelled"] } ] }, "$amount", 0 ] }
          },
          cancelledRevenue: {
            $sum: { $cond: [ { $or: [ { $eq: ["$status", "cancelled"] }, { $eq: ["$isPaid", false] } ] }, "$amount", 0 ] }
          },
          shows: { $addToSet: "$showId" },
          lastShowDate: { $max: "$showDate" },
        },
      },
      {
        $project: {
          title: 1,
          confirmedBookings: 1,
          cancelledBookings: 1,
          confirmedSeats: 1,
          cancelledSeats: 1,
          confirmedRevenue: 1,
          cancelledRevenue: 1,
          avgRevenuePerShow: {
            $cond: [
              { $gt: [{ $size: "$shows" }, 0] },
              { $divide: ["$confirmedRevenue", { $size: "$shows" }] },
              0,
            ],
          },
          lastShowDate: 1,
        },
      },
      { $sort: { confirmedRevenue: -1 } },
    ];

    const results = await Booking.aggregate(pipeline);

    const body = [
      [
        { text: "Sr", style: "th", alignment: "center" },
        { text: "Movie", style: "th" },
        { text: "Conf.\nBkng", style: "th", alignment: "center" },
        { text: "Canc.\nBkng", style: "th", alignment: "center" },
        { text: "Conf.\nSeats", style: "th", alignment: "center" },
        { text: "Canc.\nSeats", style: "th", alignment: "center" },
        { text: "Conf.\nRev (₹)", style: "th", alignment: "right" },
        { text: "Canc.\nRev (₹)", style: "th", alignment: "right" },
        { text: "Avg/Show\n(₹)", style: "th", alignment: "right" },
        { text: "Last Show", style: "th", alignment: "center" },
      ],
    ];

    results.forEach((r, i) =>
      body.push([
        { text: i + 1, alignment: "center" },
        { text: r.title || "N/A", noWrap: false },
        { text: r.confirmedBookings != null ? r.confirmedBookings : 0, alignment: "center" },
        { text: r.cancelledBookings != null ? r.cancelledBookings : 0, alignment: "center" },
        { text: r.confirmedSeats != null ? r.confirmedSeats : 0, alignment: "center" },
        { text: r.cancelledSeats != null ? r.cancelledSeats : 0, alignment: "center" },
        { text: r.confirmedRevenue != null ? `₹${r.confirmedRevenue}` : "₹0", alignment: "right" },
        { text: r.cancelledRevenue != null ? `₹${r.cancelledRevenue}` : "₹0", alignment: "right" },
        { text: r.avgRevenuePerShow != null ? `₹${Number(r.avgRevenuePerShow).toFixed(2)}` : "₹0.00", alignment: "right" },
        { text: r.lastShowDate ? moment(r.lastShowDate).format("DD-MM-YYYY") : "N/A", alignment: "center" },
      ])
    );

    const totalConfirmedRevenue = results.reduce((s, r) => s + (r.confirmedRevenue || 0), 0);
    const totalCancelledRevenue = results.reduce((s, r) => s + (r.cancelledRevenue || 0), 0);

    const docDef = {
      pageSize: "A4",
      pageOrientation: "landscape",
      pageMargins: [18, 110, 18, 60],
      images: logoBase64 ? { logo: logoBase64 } : {},
      header: (cp, pc) => ({
        columns: [
          logoBase64 ? { image: "logo", width: 80, margin: [18, 10, 0, 10] } : { text: "", width: 80 },
          { text: "QUICKSHOW — Movie Revenue", style: "headerTitle", alignment: "center" },
          { text: `Page ${cp} / ${pc}`, alignment: "right", margin: [0, 10, 18, 0] },
        ],
      }),
      footer: (cp, pc) => ({
        columns: [
          { text: `Generated: ${moment().format("DD-MM-YYYY HH:mm")}`, alignment: "left", margin: [18, 0] },
          { text: `QuickShow © ${new Date().getFullYear()}`, alignment: "center" },
          { text: `Page ${cp} of ${pc}`, alignment: "right", margin: [0, 0, 18, 0] },
        ],
        margin: [0, 8, 0, 0],
      }),
      content: [
        { text: `Summary: Movies: ${results.length}  •  Total Confirmed Revenue: ₹${totalConfirmedRevenue.toLocaleString("en-IN")}  •  Total Cancelled/Pending: ₹${totalCancelledRevenue.toLocaleString("en-IN")}`, style: "summary", margin: [0, 0, 0, 8] },
        {
          table: {
            headerRows: 1,
            widths: tableWidthsAuto(["sr", "movie", "confb", "cancb", "confs", "cancs", "confr", "cancr", "avgr", "last"]),
            body,
          },
          layout: {
            fillColor: (ri) => (ri === 0 ? "#b91c1c" : ri % 2 === 0 ? "#fff5f5" : null),
            hLineColor: () => "#f3e5e5",
            vLineColor: () => "#f3e5e5",
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },
      ],
      styles: {
        headerTitle: { fontSize: 16, bold: true, color: "#b91c1c" },
        summary: { fontSize: 10, color: "#374151" },
        th: { bold: true, color: "white", fillColor: "#b91c1c" },
      },
      defaultStyle: { font: "Roboto", fontSize: 9 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDef);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=movie-revenue-${Date.now()}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error("Movie Revenue PDF Error:", err);
    res.status(500).send("Failed to generate movie revenue pdf");
  }
});

export default router;
