// Writes a QR code as a crisp SVG, using CoreImage's built-in generator so
// nothing needs installing.
//
//   swiftc -O docs/poster/qr.swift -o docs/poster/out/qr
//   docs/poster/out/qr 'https://the-signup-link' docs/poster/qr.svg
//
// One path of dark-module runs, no quiet zone (the poster's white card is the
// margin), in solid ink so it scans whatever ground the card sits on.
// Error correction is M.

import Foundation
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count == 3 else {
    FileHandle.standardError.write("usage: qr <text> <out.svg>\n".data(using: .utf8)!)
    exit(2)
}

let filter = CIFilter(name: "CIQRCodeGenerator")!
filter.setValue(args[1].data(using: .utf8), forKey: "inputMessage")
filter.setValue("M", forKey: "inputCorrectionLevel")
guard let ci = filter.outputImage,
      let cg = CIContext().createCGImage(ci, from: ci.extent) else {
    FileHandle.standardError.write("could not generate a QR code\n".data(using: .utf8)!)
    exit(1)
}

// one pixel per module; read them back
let bmp = NSBitmapImageRep(cgImage: cg)
let w = bmp.pixelsWide, h = bmp.pixelsHigh
func dark(_ x: Int, _ y: Int) -> Bool {
    (bmp.colorAt(x: x, y: y)?.usingColorSpace(.deviceGray)?.whiteComponent ?? 1) < 0.5
}

// trim the generator's own margin
var minX = w, minY = h, maxX = -1, maxY = -1
for y in 0..<h { for x in 0..<w where dark(x, y) {
    minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
} }
let n = maxX - minX + 1

var rects = ""
for y in minY...maxY {
    var x = minX
    while x <= maxX {
        if dark(x, y) {
            let start = x
            while x <= maxX && dark(x, y) { x += 1 }
            rects += "M\(start - minX) \(y - minY)h\(x - start)v1h-\(x - start)z"
        } else { x += 1 }
    }
}

let svg = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 \(n) \(n)" shape-rendering="crispEdges">
<!-- \(args[1]) -->
<path fill="#101018" d="\(rects)"/>
</svg>

"""
try! svg.write(toFile: args[2], atomically: true, encoding: .utf8)
print("  \(args[2])  \(n)×\(n) modules")
