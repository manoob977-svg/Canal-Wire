import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Printer, FileDown, MessageCircle, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const ReportViewer = ({ report, officialName, onBack, user, onEdit, onDelete }) => {
    const printRef = useRef(null);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        const element = printRef.current;
        const opt = {
            margin: 0.5,
            filename: `CanalWire_Report_${report.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save();
    };

    const handleWhatsApp = () => {
        const formattedDate = format(new Date(report.createdAt), 'MMM dd, yyyy');
        const text = `*Canal Wire Report #${report.id}*\n*Date Date:* ${formattedDate}\n*From:* ${officialName}\n\n${report.content}\n\n_Created by: ${report.authorName}_`;
        const encodedText = encodeURIComponent(text);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    };

    if (!report) return null;

    return (
        <div className="flex-col gap-4" style={{ height: '100%' }}>

            {/* Action Toolbar */}
            <div className="glass-panel flex items-center justify-between" style={{ padding: '1rem 1.5rem' }}>
                <div className="flex gap-4 items-center">
                    <button className="btn btn-ghost" onClick={onBack}>
                        <ArrowLeft size={18} /> Back to Grid
                    </button>

                    <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }}></div>

                    {(user.role === 'Admin' || user.canEdit) && (
                        <button className="btn btn-ghost" onClick={() => onEdit(report.id)} title="Edit Report">
                            <Edit2 size={16} className="text-primary" /> Edit
                        </button>
                    )}
                    {(user.role === 'Admin' || user.canDelete) && (
                        <button className="btn btn-ghost" onClick={() => onDelete(report.id)} title="Delete Report">
                            <Trash2 size={16} style={{ color: 'var(--danger)' }} /> Delete
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    <button className="btn" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white' }} onClick={handlePrint} title="Print Document">
                        <Printer size={16} /> Print
                    </button>
                    <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.8)', color: 'white' }} onClick={handleDownloadPDF} title="Download as PDF">
                        <FileDown size={16} /> PDF
                    </button>
                    <button className="btn" style={{ background: '#25D366', color: 'white' }} onClick={handleWhatsApp} title="Share via WhatsApp">
                        <MessageCircle size={16} /> WhatsApp
                    </button>
                </div>
            </div>

            {/* Document View - This section will print/PDF */}
            <div className="glass-panel" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <div
                    ref={printRef}
                    className="print-section"
                    style={{
                        background: 'white',
                        color: 'black',
                        padding: '1.5rem',
                        borderRadius: '0px',
                        minHeight: 'auto',
                        width: '100%',
                        maxWidth: '800px',
                        margin: '0 auto',
                        fontFamily: 'serif',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1rem' }}>
                        <div>C.W No.<span style={{ marginLeft: '1rem', fontWeight: 'normal' }}>{String(report.id).padStart(2, '0')}</span></div>
                        <div>Dated:<span style={{ marginLeft: '1rem', fontWeight: 'normal' }}>{format(new Date(report.createdAt), 'dd-MMM-yyyy')}</span></div>
                    </div>

                    <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '1rem' }}>
                        <div>
                            <strong>From:</strong>
                            <div style={{ paddingLeft: '40px', whiteSpace: 'pre-wrap', marginTop: '2px' }}>{officialName}</div>
                        </div>

                        {report.toText && (
                            <div>
                                <strong>To:</strong>
                                <div style={{ paddingLeft: '40px', whiteSpace: 'pre-wrap', marginTop: '2px' }}>{report.toText}</div>
                            </div>
                        )}

                        {report.copyText && (
                            <div>
                                <strong>Copy:</strong>
                                <div style={{ paddingLeft: '40px', whiteSpace: 'pre-wrap', marginTop: '2px' }}>{report.copyText}</div>
                            </div>
                        )}
                    </div>

                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '1rem', flex: 1, minHeight: '100px' }}>
                        {(() => {
                            let text = report.content;
                            if (text.includes('\n\n---\n')) {
                                text = text.split('\n\n---\n')[0];
                            }
                            return text;
                        })()}
                    </div>

                    {/* Strict push to bottom logic without excessive margin */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', pageBreakInside: 'avoid' }}>
                        <div style={{ textAlign: 'center', fontSize: '1rem', minWidth: '250px' }}>
                            {(() => {
                                let sigText = '';
                                if (report.content.includes('\n\n---\n')) {
                                    sigText = report.content.split('\n\n---\n')[1];
                                }

                                if (sigText) {
                                    return <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}>---- Sd ----{'\n'}{sigText}</div>;
                                } else {
                                    return (
                                        <>
                                            <div style={{ borderBottom: '1px solid black', width: '200px', margin: '0 auto 8px auto' }}></div>
                                            <strong>Signature</strong>
                                        </>
                                    );
                                }
                            })()}
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#555' }}>
                            System Generated Document<br />
                            Operator: {report.authorName}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportViewer;
