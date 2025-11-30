import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import './ReportDownload.css';

interface ReportDownloadProps {
  reportUrl: string;
  format?: string;
  generatedAt?: string;
}

const ReportDownload: React.FC<ReportDownloadProps> = ({
  reportUrl,
  format: providedFormat,
  generatedAt
}) => {
  const [detectedFormat, setDetectedFormat] = useState(providedFormat || 'pdf');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to detect format from URL or filename if not provided
    if (!providedFormat) {
      const lowerUrl = reportUrl.toLowerCase();
      if (lowerUrl.includes('.xlsx') || lowerUrl.includes('excel')) {
        setDetectedFormat('excel');
      } else if (lowerUrl.includes('.html')) {
        setDetectedFormat('html');
      } else {
        setDetectedFormat('pdf');
      }
    }
  }, [reportUrl, providedFormat]);

  const formatLabels: { [key: string]: string } = {
    pdf: 'PDF',
    excel: 'Excel',
    html: 'HTML'
  };

  const formatIcons: { [key: string]: string } = {
    pdf: '📄',
    excel: '📊',
    html: '🌐'
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      
      console.log('🔗 Downloading report from:', reportUrl);
      
      // Use ApiService to make authenticated request
      const blob = await ApiService.downloadReport(reportUrl);
      
      console.log('✅ Report downloaded successfully');
      
      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create temporary link and click it
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Set filename based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = detectedFormat === 'excel' ? 'xlsx' : detectedFormat === 'html' ? 'html' : 'pdf';
      link.download = `security-report-${timestamp}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (err: any) {
      console.error('❌ Failed to download report:', err);
      setError(err.response?.data?.error?.message || 'Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (detectedFormat.toLowerCase() === 'html') {
      try {
        setDownloading(true);
        setError(null);
        
        console.log('👁️ Previewing HTML report from:', reportUrl);
        
        // For HTML, fetch with authentication and open in new tab
        const blob = await ApiService.downloadReport(reportUrl);
        
        const htmlBlob = new Blob([blob], { type: 'text/html' });
        const blobUrl = window.URL.createObjectURL(htmlBlob);
        
        window.open(blobUrl, '_blank');
        
        // Note: We can't revoke the URL immediately because the new tab needs it
        // It will be cleaned up when the page is closed
        
      } catch (err: any) {
        console.error('❌ Failed to preview report:', err);
        setError(err.response?.data?.error?.message || 'Failed to preview report');
      } finally {
        setDownloading(false);
      }
    }
  };

  return (
    <div className="report-download-container">
      <div className="report-download-card">
        <div className="report-icon">
          {formatIcons[detectedFormat.toLowerCase()] || '📄'}
        </div>
        
        <div className="report-info">
          <div className="report-format-badge">
            {formatLabels[detectedFormat.toLowerCase()] || detectedFormat.toUpperCase()}
          </div>
          <p className="report-title">Security Findings Report</p>
          {generatedAt && (
            <p className="report-meta">Generated: {new Date(generatedAt).toLocaleString()}</p>
          )}
          {error && (
            <p className="report-error">❌ {error}</p>
          )}
        </div>

        <div className="report-actions">
          <button 
            className="download-button primary"
            onClick={handleDownload}
            title="Download report"
            disabled={downloading}
          >
            <span className="button-icon">{downloading ? '⏳' : '⬇️'}</span>
            <span className="button-text">{downloading ? 'Downloading...' : 'Download'}</span>
          </button>
          
          {detectedFormat.toLowerCase() === 'html' && (
            <button 
              className="download-button secondary"
              onClick={handlePreview}
              title="Preview report"
              disabled={downloading}
            >
              <span className="button-icon">{downloading ? '⏳' : '👁️'}</span>
              <span className="button-text">{downloading ? 'Opening...' : 'Preview'}</span>
            </button>
          )}
        </div>
      </div>
      
      {!error && (
        <p className="report-note">
          💡 Report will be available for download for 24 hours
        </p>
      )}
    </div>
  );
};

export default ReportDownload;

