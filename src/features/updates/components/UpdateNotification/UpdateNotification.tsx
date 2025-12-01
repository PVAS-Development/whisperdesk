// import React, { useState, useEffect } from 'react';
// import './UpdateNotification.css';

// import type {
//   UpdateState,
//   UpdateInfo,
//   // UpdateDownloadProgress,
//   // Unsubscribe,
// } from '../../../../types';

// function UpdateNotification(): React.JSX.Element | null {
//   const [updateState, setUpdateState] = useState<UpdateState>('idle');
//   // const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
//   const [downloadProgress, setDownloadProgress] = useState<number>(0);
//   // const [error, setError] = useState<string | null>(null);
//   const [dismissed, setDismissed] = useState<boolean>(false);

//   // useEffect(() => {
//   //   const unsubscribers: (Unsubscribe | undefined)[] = [];

//   //   unsubscribers.push(
//   //     window.electronAPI?.onUpdateChecking?.(() => {
//   //       setUpdateState('checking');
//   //       setError(null);
//   //     })
//   //   );

//   //   unsubscribers.push(
//   //     window.electronAPI?.onUpdateAvailable?.((info: UpdateInfo) => {
//   //       setUpdateState('available');
//   //       setUpdateInfo(info);
//   //       setDismissed(false);
//   //     })
//   //   );

//   //   unsubscribers.push(
//   //     window.electronAPI?.onUpdateNotAvailable?.(() => {
//   //       setUpdateState('idle');
//   //     })
//   //   );

//   //   unsubscribers.push(
//   //     window.electronAPI?.onUpdateProgress?.((progress: UpdateDownloadProgress) => {
//   //       setUpdateState('downloading');
//   //       setDownloadProgress(progress.percent);
//   //     })
//   //   );

//   //   unsubscribers.push(
//   //     window.electronAPI?.onUpdateDownloaded?.((info: UpdateInfo) => {
//   //       setUpdateState('ready');
//   //       setUpdateInfo(info);
//   //     })
//   //   );

//   //   unsubscribers.push(
//   //     window.electronAPI?.onUpdateError?.((message: string) => {
//   //       setUpdateState('error');
//   //       setError(message);
//   //     })
//   //   );

//   //   return () => {
//   //     unsubscribers.forEach((unsub) => unsub?.());
//   //   };
//   // }, []);

//   const handleDownload = async (): Promise<void> => {
//     setUpdateState('downloading');
//     setDownloadProgress(0);
//     await window.electronAPI?.downloadUpdate();
//   };

//   const handleInstall = (): void => {
//     window.electronAPI?.installUpdate();
//   };

//   const handleDismiss = (): void => {
//     setDismissed(true);
//   };

//   const handleDismissError = (): void => {
//     setUpdateState('idle');
//   };

//   if (dismissed && updateState !== 'ready') return null;
//   if (updateState === 'idle') return null;

//   return (
//     <div className={`update-notification ${updateState}`}>
//       {updateState === 'checking' && (
//         <div className="update-content">
//           <span className="update-spinner"></span>
//           <span>Checking for updates...</span>
//         </div>
//       )}

//       {updateState === 'available' && (
//         <div className="update-content">
//           <span className="update-icon">🎉</span>
//           <div className="update-text">
//             <strong>Update available!</strong>
//             <span>Version {updateInfo?.version} is ready to download</span>
//           </div>
//           <div className="update-actions">
//             <button className="btn-update" onClick={handleDownload}>
//               Download
//             </button>
//             <button className="btn-dismiss" onClick={handleDismiss}>
//               Later
//             </button>
//           </div>
//         </div>
//       )}

//       {updateState === 'downloading' && (
//         <div className="update-content">
//           <div className="update-text">
//             <strong>Downloading update...</strong>
//             <div className="update-progress-bar">
//               <div className="update-progress-fill" style={{ width: `${downloadProgress}%` }} />
//             </div>
//             <span>{Math.round(downloadProgress)}%</span>
//           </div>
//         </div>
//       )}

//       {updateState === 'ready' && (
//         <div className="update-content">
//           <span className="update-icon">✨</span>
//           <div className="update-text">
//             <strong>Update ready!</strong>
//             <span>Restart to install version {updateInfo?.version}</span>
//           </div>
//           <div className="update-actions">
//             <button className="btn-update" onClick={handleInstall}>
//               Restart Now
//             </button>
//             <button className="btn-dismiss" onClick={handleDismiss}>
//               Later
//             </button>
//           </div>
//         </div>
//       )}

//       {updateState === 'error' && (
//         <div className="update-content">
//           <span className="update-icon">⚠️</span>
//           <div className="update-text">
//             <span>{error || 'Failed to check for updates'}</span>
//           </div>
//           <button className="btn-dismiss" onClick={handleDismissError}>
//             Dismiss
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default UpdateNotification;
