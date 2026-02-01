'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileImage, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { processImage, extractCalculationData, compareWithCalculation } from '@/lib/ocr-processor'
import { GlassCard } from '@/components/ui/glass-card'
import { MotionButton } from '@/components/ui/motion-button'

interface ImageVerifierProps {
  segments: any[]
  totalArrear: number
}

export default function ImageVerifier({ segments, totalArrear }: ImageVerifierProps) {
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([])
  const [processing, setProcessing] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setUploadedImages(prev => [...prev, ...newImages])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 5
  })

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleVerify = async () => {
    if (uploadedImages.length === 0) return

    setProcessing(true)
    setVerificationResult(null)

    try {
      // Process all images and combine OCR results
      const ocrResults = await Promise.all(
        uploadedImages.map(img => processImage(img.file))
      )

      // Combine all OCR text
      const combinedText = ocrResults.map(r => r.text).join('\n')
      const avgConfidence = ocrResults.reduce((sum, r) => sum + r.confidence, 0) / ocrResults.length

      // Extract data from OCR text
      const extractedData = extractCalculationData(combinedText)

      // Compare with system calculation
      const comparison = compareWithCalculation(extractedData, segments, totalArrear)

      setVerificationResult({
        ocrConfidence: avgConfidence,
        extractedData,
        comparison,
        rawText: combinedText
      })
    } catch (error) {
      console.error('Verification error:', error)
      alert('Failed to verify images. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileImage className="h-5 w-5 text-blue-600" />
        Document Verification
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload reference calculation sheets to verify accuracy using OCR
      </p>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop images here...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-1">Drag & drop images here</p>
            <p className="text-sm text-gray-500">or click to select files (PNG, JPG)</p>
          </>
        )}
      </div>

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {uploadedImages.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img.preview}
                alt={`Upload ${idx + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Verify Button */}
      {uploadedImages.length > 0 && (
        <div className="mt-4">
          <MotionButton
            onClick={handleVerify}
            disabled={processing}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Documents
              </>
            )}
          </MotionButton>
        </div>
      )}

      {/* Verification Results */}
      {verificationResult && (
        <div className="mt-6 space-y-4">
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Verification Results</h3>
            
            {/* Overall Accuracy */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Overall Accuracy</span>
                <span className={`text-2xl font-bold ${
                  verificationResult.comparison.accuracy >= 80 ? 'text-green-600' :
                  verificationResult.comparison.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {verificationResult.comparison.accuracy.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    verificationResult.comparison.accuracy >= 80 ? 'bg-green-500' :
                    verificationResult.comparison.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${verificationResult.comparison.accuracy}%` }}
                />
              </div>
            </div>

            {/* Detailed Comparison */}
            <div className="space-y-2">
              {verificationResult.comparison.details.map((detail: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    detail.match ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  {detail.match ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{detail.field}</p>
                    <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                      <p>Extracted: <span className="font-mono">{detail.extracted}</span></p>
                      <p>System: <span className="font-mono">{detail.system}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* OCR Confidence */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                OCR Confidence: <span className="font-semibold">{(verificationResult.ocrConfidence * 100).toFixed(1)}%</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {verificationResult.extractedData.periods.length} periods detected, 
                {' '}{verificationResult.extractedData.amounts.length} amounts extracted
              </p>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
