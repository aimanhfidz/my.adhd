// Snapshots every slide of a carousel deck to PNG, and stacks them into a PDF.
//
//   swiftc docs/carousel/render.swift -o docs/carousel/out/render
//   docs/carousel/out/render <url-to-carousel.html?post=slug&render=1> <outdir> [scale]
//
// Loads the page in an offscreen WKWebView sized to one slide (1080×1350),
// waits for carousel.js to set window.__ready (fonts loaded), then scrolls
// each slide to the top and takes a snapshot. `scale` is 1 by default
// (1080×1350 files); pass 2 for 2160×2700. The PDF is built from the same
// slides with createPDF, so its text stays selectable, and merged with PDFKit.
//
// The offscreen window runs no animation pipeline, so transitions are
// disabled by injection before anything is measured.

import Cocoa
import WebKit
import PDFKit

let args = CommandLine.arguments
guard args.count >= 3, let url = URL(string: args[1]) else {
    FileHandle.standardError.write("usage: render <url> <outdir> [scale]\n".data(using: .utf8)!)
    exit(2)
}
let outDir = URL(fileURLWithPath: args[2], isDirectory: true)
let scale = args.count > 3 ? (Double(args[3]) ?? 1) : 1
let W = 1080.0, H = 1350.0
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)

let cfg = WKWebViewConfiguration()
cfg.websiteDataStore = .nonPersistent()
let kill = WKUserScript(
    source: "var s=document.createElement('style');s.textContent='*{transition:none!important;animation:none!important}';document.documentElement.appendChild(s);",
    injectionTime: .atDocumentEnd, forMainFrameOnly: true)
cfg.userContentController.addUserScript(kill)

let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: W, height: H),
                      styleMask: [.borderless], backing: .buffered, defer: false)
let web = WKWebView(frame: NSRect(x: 0, y: 0, width: W, height: H), configuration: cfg)
window.contentView = web

var done = false
func spin(_ seconds: Double) {
    let until = Date().addingTimeInterval(seconds)
    while Date() < until { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02)) }
}
func js(_ src: String) -> Any? {
    var out: Any? = nil; var fin = false
    web.evaluateJavaScript(src) { r, e in
        if let e = e { FileHandle.standardError.write("js error: \(e)\n".data(using: .utf8)!) }
        out = r; fin = true
    }
    while !fin { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02)) }
    return out
}
func fail(_ msg: String) -> Never {
    FileHandle.standardError.write((msg + "\n").data(using: .utf8)!); exit(1)
}

web.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalAndRemoteCacheData))

// wait for ready
var waited = 0.0
while (js("window.__ready === true") as? Bool) != true {
    spin(0.1); waited += 0.1
    if waited > 20 { fail("page never became ready: \(url)") }
}
spin(0.3)

let count = js("Number(document.body.dataset.count)") as? Int ?? 0
if count == 0 { fail("no slides found") }
let slug = (js("(new URLSearchParams(location.search)).get('post') || 'deck'") as? String) ?? "deck"

let pdf = PDFDocument()
for i in 0..<count {
    _ = js("document.querySelectorAll('.slide')[\(i)].scrollIntoView({block:'start'}); window.scrollY")
    spin(0.15)

    // PNG
    let snap = WKSnapshotConfiguration()
    snap.rect = CGRect(x: 0, y: 0, width: W, height: H)
    snap.snapshotWidth = NSNumber(value: W * scale)
    var image: NSImage? = nil; var fin = false
    web.takeSnapshot(with: snap) { img, e in
        if let e = e { FileHandle.standardError.write("snapshot error: \(e)\n".data(using: .utf8)!) }
        image = img; fin = true
    }
    while !fin { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02)) }
    // The screen is Retina, so the snapshot's bitmap is 2x its point size.
    // Draw it into a bitmap of the exact pixel size we asked for.
    guard let img = image else { fail("no image for slide \(i+1)") }
    let pw = Int(W * scale), ph = Int(H * scale)
    guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pw, pixelsHigh: ph,
                                     bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                                     colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)
    else { fail("no bitmap for slide \(i+1)") }
    rep.size = NSSize(width: pw, height: ph)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high
    img.draw(in: NSRect(x: 0, y: 0, width: pw, height: ph), from: .zero, operation: .copy, fraction: 1)
    NSGraphicsContext.restoreGraphicsState()
    guard let png = rep.representation(using: .png, properties: [:]) else { fail("no png for slide \(i+1)") }
    let name = String(format: "%02d.png", i + 1)
    try! png.write(to: outDir.appendingPathComponent(name))
    print("  \(name)  \(rep.pixelsWide)x\(rep.pixelsHigh)")

    // PDF page
    if #available(macOS 11.0, *) {
        let pc = WKPDFConfiguration()
        pc.rect = CGRect(x: 0, y: 0, width: W, height: H)
        var data: Data? = nil; var pfin = false
        web.createPDF(configuration: pc) { r in
            if case .success(let d) = r { data = d }
            if case .failure(let e) = r { FileHandle.standardError.write("pdf error: \(e)\n".data(using: .utf8)!) }
            pfin = true
        }
        while !pfin { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02)) }
        if let d = data, let doc = PDFDocument(data: d), let page = doc.page(at: 0) {
            pdf.insert(page, at: pdf.pageCount)
        }
    }
}
if pdf.pageCount > 0 {
    let pdfURL = outDir.appendingPathComponent("\(slug).pdf")
    pdf.write(to: pdfURL)
    print("  \(slug).pdf  \(pdf.pageCount) pages")
}
exit(0)
