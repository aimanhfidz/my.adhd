// Rasterise an SVG to a transparent PNG at a given width.
//
//   swiftc -O icons/snap.swift -o icons/out/snap
//   icons/out/snap <in.svg> <out.png> <width>
//
// There is no SVG rasteriser on this machine and no node — but WebKit is a
// rasteriser, so the file is loaded into an offscreen WKWebView sized to the
// SVG's own aspect ratio and snapshotted. The web view draws no background,
// so the PNG keeps its alpha: the wordmark has to sit on a page, a slide and
// a dark ground without a white box around it.

import Cocoa
import WebKit

let a = CommandLine.arguments
guard a.count >= 4, let width = Double(a[3]) else {
    FileHandle.standardError.write("usage: snap <in.svg> <out.png> <width>\n".data(using: .utf8)!)
    exit(2)
}
let src = URL(fileURLWithPath: a[1])
let svg = (try? String(contentsOf: src, encoding: .utf8)) ?? ""

// viewBox carries the aspect ratio; the height follows from the width asked for.
func viewBox(_ s: String) -> (Double, Double)? {
    guard let r = s.range(of: "viewBox=\"[^\"]+\"", options: .regularExpression) else { return nil }
    let n = s[r].split(separator: "\"")[1].split(separator: " ").compactMap { Double($0) }
    return n.count == 4 ? (n[2], n[3]) : nil
}
guard let (vw, vh) = viewBox(svg) else {
    FileHandle.standardError.write("no viewBox in \(src.lastPathComponent)\n".data(using: .utf8)!)
    exit(1)
}
let W = width, H = (width * vh / vw).rounded()

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let cfg = WKWebViewConfiguration()
cfg.websiteDataStore = .nonPersistent()
let win = NSWindow(contentRect: NSRect(x: 0, y: 0, width: W, height: H),
                   styleMask: [.borderless], backing: .buffered, defer: false)
let web = WKWebView(frame: NSRect(x: 0, y: 0, width: W, height: H), configuration: cfg)
web.setValue(false, forKey: "drawsBackground")
win.contentView = web

let page = """
<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;width:100%;height:100%;background:transparent}
svg{display:block;width:100%;height:100%}</style>\(svg)
"""
web.loadHTMLString(page, baseURL: nil)

func spin(_ s: Double) {
    let until = Date().addingTimeInterval(s)
    while Date() < until { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02)) }
}
spin(1.2)

let conf = WKSnapshotConfiguration()
conf.rect = NSRect(x: 0, y: 0, width: W, height: H)
var fin = false
web.takeSnapshot(with: conf) { img, _ in
    defer { fin = true }
    guard let img = img, let tiff = img.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else {
        FileHandle.standardError.write("snapshot failed\n".data(using: .utf8)!); exit(1)
    }
    try? png.write(to: URL(fileURLWithPath: a[2]))
    print("  \(a[2])  \(Int(W))x\(Int(H))")
}
while !fin { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02)) }
