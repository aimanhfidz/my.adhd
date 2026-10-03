// Renders docs/promo/promo.html to an MP4, one frame at a time.
//
//   swiftc -O docs/promo/render.swift -o docs/promo/out/render
//   python3 serve.py 8770 &
//   docs/promo/out/render "http://localhost:8770/docs/promo/promo.html?render=1" docs/promo/out/myadhd-promo.mp4
//
// Or, to look at single frames first (PNG per time, in seconds):
//   docs/promo/out/render "<url>" docs/promo/out/stills --stills 1,8,14,21,28
//
// There is no ffmpeg here and none is needed: WebKit draws each frame and
// AVFoundation encodes it. The page is a pure function of time — seek(t)
// sets every attribute for that instant — so this never races a clock. It
// calls seek, snapshots, appends, and moves on; a slow frame is simply a
// slow frame, never a dropped one.

import Cocoa
import WebKit
import AVFoundation

let args = CommandLine.arguments
guard args.count >= 3, let url = URL(string: args[1]) else {
    FileHandle.standardError.write("usage: render <url> <out.mp4 | outdir --stills t1,t2>\n".data(using: .utf8)!)
    exit(2)
}
let outPath = args[2]
let stills: [Double]? = {
    guard let i = args.firstIndex(of: "--stills"), i + 1 < args.count else { return nil }
    return args[i + 1].split(separator: ",").compactMap { Double($0) }
}()

let W = 1080, H = 1920, FPS: Int32 = 30, DURATION = 30.0

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)

let cfg = WKWebViewConfiguration()
cfg.websiteDataStore = .nonPersistent()
let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: W, height: H),
                      styleMask: [.borderless], backing: .buffered, defer: false)
let web = WKWebView(frame: NSRect(x: 0, y: 0, width: W, height: H), configuration: cfg)
window.contentView = web

func fail(_ msg: String) -> Never {
    FileHandle.standardError.write((msg + "\n").data(using: .utf8)!)
    exit(1)
}

/// One frame of the page at time t, as a bitmap exactly W×H.
func frame(at t: Double, _ done: @escaping (CGImage) -> Void) {
    web.evaluateJavaScript("seek(\(t)); 0") { _, err in
        if let err = err { fail("seek(\(t)) failed: \(err)") }
        let snap = WKSnapshotConfiguration()
        snap.snapshotWidth = NSNumber(value: W)
        web.takeSnapshot(with: snap) { img, err in
            guard let img = img, let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil)
            else { fail("snapshot at \(t)s failed: \(String(describing: err))") }
            done(cg)
        }
    }
}

func writeStills(_ times: [Double]) {
    let dir = URL(fileURLWithPath: outPath, isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    var queue = times
    func next() {
        guard let t = queue.first else { exit(0) }
        queue.removeFirst()
        frame(at: t) { cg in
            let rep = NSBitmapImageRep(cgImage: cg)
            let file = dir.appendingPathComponent(String(format: "still-%05.2f.png", t))
            try? rep.representation(using: .png, properties: [:])?.write(to: file)
            print("wrote \(file.lastPathComponent)")
            next()
        }
    }
    next()
}

func writeMovie() {
    let out = URL(fileURLWithPath: outPath)
    try? FileManager.default.createDirectory(at: out.deletingLastPathComponent(), withIntermediateDirectories: true)
    try? FileManager.default.removeItem(at: out)
    guard let writer = try? AVAssetWriter(outputURL: out, fileType: .mp4) else { fail("cannot write \(out.path)") }
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: W,
        AVVideoHeightKey: H,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 14_000_000,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            AVVideoMaxKeyFrameIntervalKey: 30,
        ],
    ])
    input.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
        kCVPixelBufferWidthKey as String: W,
        kCVPixelBufferHeightKey as String: H,
    ])
    writer.add(input)
    guard writer.startWriting() else { fail("writer: \(String(describing: writer.error))") }
    writer.startSession(atSourceTime: .zero)

    let total = Int(DURATION * Double(FPS))
    let started = Date()
    func step(_ i: Int) {
        if i == total {
            input.markAsFinished()
            writer.finishWriting {
                print(String(format: "done: %d frames in %.0fs → %@", total, Date().timeIntervalSince(started), out.path))
                exit(writer.status == .completed ? 0 : 1)
            }
            return
        }
        frame(at: Double(i) / Double(FPS)) { cg in
            var pb: CVPixelBuffer?
            guard let pool = adaptor.pixelBufferPool,
                  CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pb) == kCVReturnSuccess, let buf = pb
            else { fail("no pixel buffer at frame \(i)") }
            CVPixelBufferLockBaseAddress(buf, [])
            let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: W, height: H,
                                bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buf),
                                space: CGColorSpace(name: CGColorSpace.sRGB)!,
                                bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue)!
            ctx.interpolationQuality = .high
            ctx.draw(cg, in: CGRect(x: 0, y: 0, width: W, height: H))
            CVPixelBufferUnlockBaseAddress(buf, [])
            while !input.isReadyForMoreMediaData { RunLoop.current.run(until: Date().addingTimeInterval(0.005)) }
            adaptor.append(buf, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: FPS))
            if i % 90 == 0 { print("frame \(i)/\(total)") }
            step(i + 1)
        }
    }
    step(0)
}

/// Wait for promo.html to say its fonts are in and the scene is built.
func waitReady(_ tries: Int = 0) {
    web.evaluateJavaScript("window.__ready === true") { v, _ in
        if (v as? Bool) == true {
            if let s = stills { writeStills(s) } else { writeMovie() }
        } else if tries > 150 {
            fail("page never became ready — is serve.py running, and are the fonts reachable?")
        } else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { waitReady(tries + 1) }
        }
    }
}

web.load(URLRequest(url: url))
DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { waitReady() }
app.run()
