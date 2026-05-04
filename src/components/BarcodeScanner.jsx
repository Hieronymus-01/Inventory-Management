import React, { useState, useRef, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { NotFoundException } from '@zxing/library'
import { FaBarcode, FaCamera, FaStop, FaKeyboard } from 'react-icons/fa'
import { MdQrCodeScanner, MdFlipCameraAndroid } from 'react-icons/md'

const BarcodeScanner = ({ onScan, label = "Barcode / QR Scanner" }) => {
    const [mode, setMode] = useState('keyboard')
    const [scanning, setScanning] = useState(false)
    const [cameras, setCameras] = useState([])
    const [selectedCamera, setSelectedCamera] = useState('')
    const [keyboardValue, setKeyboardValue] = useState('')
    const [lastScanned, setLastScanned] = useState('')
    const [error, setError] = useState('')

    const videoRef = useRef(null)
    const readerRef = useRef(null)
    const keyboardRef = useRef(null)

    useEffect(() => {
        const getCameras = async () => {
            try {
                const devices = await BrowserMultiFormatReader.listVideoInputDevices()
                setCameras(devices)
                if (devices.length > 0) setSelectedCamera(devices[0].deviceId)
            } catch (err) {
                setError('Could not access camera list.')
            }
        }
        getCameras()
        return () => stopCamera()
    }, [])

    const startCamera = async () => {
        setError('')
        try {
            readerRef.current = new BrowserMultiFormatReader()
            setScanning(true)
            await readerRef.current.decodeFromVideoDevice(
                selectedCamera || undefined,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        const text = result.getText()
                        if (text !== lastScanned) {
                            setLastScanned(text)
                            handleScanned(text)
                            setTimeout(() => setLastScanned(''), 2000)
                        }
                    }
                    if (err && !(err instanceof NotFoundException)) {
                        console.warn('Scan error:', err)
                    }
                }
            )
        } catch (err) {
            setError('Could not start camera. Check camera permissions.')
            setScanning(false)
        }
    }

    const stopCamera = () => {
        // Stop zxing reader
        if (readerRef.current) {
            try {
                readerRef.current.reset()
            } catch (e) { }
            readerRef.current = null
        }

        // Force stop all video tracks — this actually turns the camera off
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
            videoRef.current.srcObject = null
        }

        setScanning(false)
        setLastScanned('')
    }

    const switchMode = (newMode) => {
        stopCamera()
        setMode(newMode)
        setError('')
        if (newMode === 'keyboard') {
            setTimeout(() => keyboardRef.current?.focus(), 100)
        }
    }

    const handleScanned = (value) => {
        if (!value.trim()) return
        onScan(value.trim())
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && keyboardValue.trim()) {
            handleScanned(keyboardValue.trim())
            setKeyboardValue('')
        }
    }

    const handleManualSubmit = () => {
        if (keyboardValue.trim()) {
            handleScanned(keyboardValue.trim())
            setKeyboardValue('')
        }
    }

    return (
        <div className="border border-base-200 rounded-xl bg-base-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-base-200 bg-base-200 flex items-center justify-between">
                <p className="text-xs font-bold text-base-content/70 uppercase tracking-wider flex items-center gap-2">
                    <MdQrCodeScanner className="text-base text-black" />
                    {label}
                </p>
                <div className="flex rounded-full bg-base-300 p-0.5 gap-0.5">
                    <button
                        onClick={() => switchMode('keyboard')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                            ${mode === 'keyboard' ? 'bg-black text-white shadow' : 'text-base-content/60 hover:text-black'}`}>
                        <FaKeyboard className="text-xs" />
                        <span className="hidden sm:inline">Physical</span>
                    </button>
                    <button
                        onClick={() => switchMode('camera')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                            ${mode === 'camera' ? 'bg-black text-white shadow' : 'text-base-content/60 hover:text-black'}`}>
                        <FaCamera className="text-xs" />
                        <span className="hidden sm:inline">Camera</span>
                    </button>
                </div>
            </div>

            <div className="p-4">
                {mode === 'keyboard' && (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <FaBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-lg" />
                                <input
                                    ref={keyboardRef}
                                    type="text"
                                    className="input input-bordered w-full pl-10 font-mono text-sm"
                                    placeholder="Plug in scanner and scan, or type barcode then press Enter..."
                                    value={keyboardValue}
                                    onChange={e => setKeyboardValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleManualSubmit}
                                disabled={!keyboardValue.trim()}
                                className="btn btn-neutral rounded-full gap-2 px-5">
                                <MdQrCodeScanner className="text-lg" />
                                <span className="hidden sm:inline">Search</span>
                            </button>
                        </div>
                        <p className="text-xs text-base-content/40 flex items-center gap-1">
                            <FaKeyboard className="text-xs" />
                            Connect a USB/Bluetooth barcode scanner — it will type the barcode automatically and press Enter
                        </p>
                    </div>
                )}

                {mode === 'camera' && (
                    <div className="space-y-3">
                        {cameras.length > 1 && (
                            <div className="flex gap-2 items-center">
                                <MdFlipCameraAndroid className="text-base-content/40 flex-shrink-0" />
                                <select
                                    className="select select-bordered select-sm flex-1"
                                    value={selectedCamera}
                                    onChange={e => {
                                        setSelectedCamera(e.target.value)
                                        if (scanning) { stopCamera(); setTimeout(startCamera, 300) }
                                    }}>
                                    {cameras.map((cam, i) => (
                                        <option key={cam.deviceId} value={cam.deviceId}>
                                            {cam.label || `Camera ${i + 1}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/7' }}>
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                style={{ display: scanning ? 'block' : 'none' }}
                            />
                            {scanning && (
                                <>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="relative w-48 h-32">
                                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
                                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
                                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
                                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
                                            <div className="absolute left-1 right-1 h-0.5 bg-green-400 opacity-80"
                                                style={{ animation: 'scanline 1.5s ease-in-out infinite', top: '50%' }} />
                                        </div>
                                    </div>
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-white text-xs font-medium">LIVE</span>
                                    </div>
                                    {lastScanned && (
                                        <div className="absolute bottom-3 left-3 right-3 bg-green-500/90 text-white px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2">
                                            <MdQrCodeScanner />
                                            Scanned: {lastScanned}
                                        </div>
                                    )}
                                </>
                            )}
                            {!scanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
                                    <FaCamera className="text-gray-400 text-4xl" />
                                    <p className="text-gray-400 text-sm">Camera is off</p>
                                    <p className="text-gray-500 text-xs">Click Start Scanning to activate</p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="alert alert-error text-sm py-2">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {!scanning ? (
                                <button onClick={startCamera} className="btn btn-neutral rounded-full gap-2 flex-1">
                                    <FaCamera /> Start Scanning
                                </button>
                            ) : (
                                <button onClick={stopCamera} className="btn btn-error rounded-full gap-2 flex-1 text-white">
                                    <FaStop /> Stop Camera
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-base-content/40 flex items-center gap-1">
                            <FaCamera className="text-xs" />
                            Point camera at any barcode or QR code — it will auto-detect and scan
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes scanline {
                    0%, 100% { transform: translateY(-24px); opacity: 0.3; }
                    50% { transform: translateY(24px); opacity: 1; }
                }
            `}</style>
        </div>
    )
}

export default BarcodeScanner