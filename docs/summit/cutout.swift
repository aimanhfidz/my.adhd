// Cuts each speaker out of their photo and frames them the same way, so
// three photos taken in three different places read as one set.
//
//   swift docs/summit/cutout.swift
//
// Reads docs/summit/photos/<name>.png and writes
// docs/summit/photos/out/<name>.png: a transparent 480×640 head-and-
// shoulders. Everything runs on this Mac (Apple Vision); no photo leaves it.
//
// The frame is set from the face, not the photo: the face is 30% of the
// frame's width and its centre sits 38% down, so a seated photo and a
// standing one come out at the same scale. Only the person under the face
// is kept, so a chair or a second person in the shot is dropped.

import AppKit
import CoreImage
import Vision

let here = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
let srcDir = here.appendingPathComponent("photos")
let outDir = srcDir.appendingPathComponent("out")
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

let OUT_W = 480, OUT_H = 640
let FACE_SHARE = 0.30      // face width ÷ frame width
let FACE_Y = 0.38          // face centre, as a share of frame height from the top
let FACE_Y_MAX = 0.43      // how low a short photo may sit the face to fill the frame

// px to shave off every edge before anything else, for a photo that
// arrives as a screenshot with a border or handles still on.
let trim: [String: Int] = [:]

// how far to pull the edge in, px. A busy or bright background leaves a
// wider fringe: Yasmin's dark green backdrop, Noor's sunlit garden.
let erode: [String: Double] = ["yasmin": 2.0, "noor": 3.0]

// The frame centres on the face. When the head tilts or the shoulders lean,
// the figure as a whole sits off to one side: move the subject right (+) or
// left (-) by this share of the frame's width. Yasmin's hijab and shoulders
// lean to her right, which is the frame's left.
let nudgeX: [String: Double] = ["yasmin": 0.07]

// Areas to drop by hand, in the source photo's px (origin top-left, after
// the trim), for when Vision counts a chair or a prop as the person.
let erase: [String: [CGPoint]] = [:]

func fail(_ s: String) -> Never { FileHandle.standardError.write((s + "\n").data(using: .utf8)!); exit(1) }

func cgImage(_ url: URL) -> CGImage {
    guard let img = NSImage(contentsOf: url) else { fail("can't read \(url.lastPathComponent)") }
    var r = NSRect(origin: .zero, size: img.size)
    guard let cg = img.cgImage(forProposedRect: &r, context: nil, hints: nil) else { fail("no bitmap in \(url.lastPathComponent)") }
    return cg
}

let ci = CIContext()
let files = (try? FileManager.default.contentsOfDirectory(at: srcDir, includingPropertiesForKeys: nil)) ?? []
let photos = files.filter { ["png", "jpg", "jpeg", "heic"].contains($0.pathExtension.lowercased()) }.sorted { $0.path < $1.path }
if photos.isEmpty { fail("no photos in \(srcDir.path)") }

for url in photos {
    let name = url.deletingPathExtension().lastPathComponent
    var cg = cgImage(url)
    if let t = trim[name] {
        cg = cg.cropping(to: CGRect(x: t, y: t, width: cg.width - 2 * t, height: cg.height - 2 * t))!
    }
    let W = Double(cg.width), H = Double(cg.height)
    let handler = VNImageRequestHandler(cgImage: cg)

    // the face sets the frame
    let faceReq = VNDetectFaceRectanglesRequest()
    try handler.perform([faceReq])
    guard let face = (faceReq.results ?? []).max(by: { $0.boundingBox.width < $1.boundingBox.width }) else {
        fail("\(name): no face found")
    }
    let fb = face.boundingBox                         // normalised, origin bottom-left
    let faceW = fb.width * W
    let faceCX = fb.midX * W
    let faceCYTop = (1 - fb.midY) * H                 // from the top

    // the person under the face is kept
    let maskReq = VNGenerateForegroundInstanceMaskRequest()
    try handler.perform([maskReq])
    guard let obs = maskReq.results?.first else { fail("\(name): no foreground found") }
    let labels = obs.instanceMask
    CVPixelBufferLockBaseAddress(labels, .readOnly)
    let lw = CVPixelBufferGetWidth(labels), lh = CVPixelBufferGetHeight(labels)
    let row = CVPixelBufferGetBytesPerRow(labels)
    let base = CVPixelBufferGetBaseAddress(labels)!.assumingMemoryBound(to: UInt8.self)
    let lx = min(lw - 1, Int(fb.midX * Double(lw)))
    let ly = min(lh - 1, Int((1 - fb.midY) * Double(lh)))
    let label = Int(base[ly * row + lx])
    CVPixelBufferUnlockBaseAddress(labels, .readOnly)
    let keep = label > 0 ? IndexSet(integer: label) : obs.allInstances
    let full = CGRect(x: 0, y: 0, width: W, height: H)
    var mask = CIImage(cvPixelBuffer: try obs.generateScaledMaskForImage(forInstances: keep, from: handler))

    // "Foreground" counts a chair someone is sitting in. Person segmentation
    // doesn't, but its edge is soft — so it only vetoes, grown a little, and
    // the foreground mask still draws the fine edge of hair and fabric.
    let personReq = VNGeneratePersonSegmentationRequest()
    personReq.qualityLevel = .accurate
    personReq.outputPixelFormat = kCVPixelFormatType_OneComponent8
    try handler.perform([personReq])
    if let pm = personReq.results?.first?.pixelBuffer {
        var person = CIImage(cvPixelBuffer: pm)
        person = person.transformed(by: CGAffineTransform(scaleX: W / person.extent.width, y: H / person.extent.height))
        person = person.applyingFilter("CIMorphologyMaximum", parameters: ["inputRadius": 6])
            .applyingGaussianBlur(sigma: 3).cropped(to: full)
        mask = mask.applyingFilter("CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: person])
    }
    if let poly = erase[name], let ectx = CGContext(data: nil, width: Int(W), height: Int(H), bitsPerComponent: 8, bytesPerRow: 0,
                                                     space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) {
        ectx.setFillColor(gray: 1, alpha: 1); ectx.fill(full)
        ectx.setFillColor(gray: 0, alpha: 1)
        ectx.addLines(between: poly.map { CGPoint(x: $0.x, y: H - $0.y) }); ectx.closePath(); ectx.fillPath()
        let keepArea = CIImage(cgImage: ectx.makeImage()!).applyingGaussianBlur(sigma: 1.2).cropped(to: full)
        mask = mask.applyingFilter("CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: keepArea])
    }
    // pull the edge in a touch: the last pixels carry the old wall's colour
    mask = mask.applyingFilter("CIMorphologyMinimum", parameters: ["inputRadius": erode[name] ?? 1.5])
        .applyingGaussianBlur(sigma: 0.7).cropped(to: full)

    let cutImage = CIImage(cgImage: cg).applyingFilter("CIBlendWithMask", parameters: [
        kCIInputBackgroundImageKey: CIImage.empty(),
        kCIInputMaskImageKey: mask,
    ])
    guard let cut = ci.createCGImage(cutImage, from: full) else { fail("\(name): mask failed") }

    // frame it: same face scale and eye line for everyone
    var fw = faceW / FACE_SHARE
    var fh = fw * Double(OUT_H) / Double(OUT_W)
    var faceY = FACE_Y
    // A photo cropped at the chest would end in a hard line partway down
    // the frame. Sit the face a little lower first, then frame tighter,
    // until the photo's bottom edge is the frame's: the face comes out
    // larger than the others, which reads better than a body that stops
    // in mid-air.
    if faceCYTop + (1 - faceY) * fh > H {
        faceY = min(FACE_Y_MAX, 1 - (H - faceCYTop) / fh)
        if faceCYTop + (1 - faceY) * fh > H {
            fh = (H - faceCYTop) / (1 - faceY)
            fw = fh * Double(OUT_W) / Double(OUT_H)
        }
    }
    let left = faceCX - fw / 2 - (nudgeX[name] ?? 0) * fw
    let top = faceCYTop - faceY * fh

    guard let ctx = CGContext(data: nil, width: OUT_W, height: OUT_H, bitsPerComponent: 8, bytesPerRow: 0,
                              space: CGColorSpace(name: CGColorSpace.sRGB)!,
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { fail("context") }
    ctx.interpolationQuality = .high
    let s = Double(OUT_W) / fw
    // CG's origin is bottom-left: place the whole cut-out so the frame lands on the canvas
    let drawRect = CGRect(x: -left * s, y: Double(OUT_H) - (H - top) * s, width: W * s, height: H * s)
    ctx.draw(cut, in: drawRect)
    guard let framed = ctx.makeImage() else { fail("\(name): frame failed") }

    let rep = NSBitmapImageRep(cgImage: framed)
    let dest = outDir.appendingPathComponent(name + ".png")
    try rep.representation(using: .png, properties: [:])!.write(to: dest)
    print(String(format: "%@  face %.0fpx → frame %.0f×%.0f (x%.2f, face %.0f%% wide, %.0f%% down)  label %d  → %@",
                 name, faceW, fw, fh, s, faceW / fw * 100, faceY * 100, label, dest.lastPathComponent))
}
