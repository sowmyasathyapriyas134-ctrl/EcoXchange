from pathlib import Path
import re
files = [
    'src/pages/supervisor/SupervisorDashboard.jsx',
    'src/components/supervisor/PendingVerificationTable.jsx',
    'src/components/supervisor/DeliveryAgentList.jsx',
    'src/components/supervisor/AgentMap.jsx',
    'src/components/supervisor/TaskAssignmentPanel.jsx',
    'src/components/supervisor/AnalyticsOverview.jsx',
    'src/components/supervisor/RecentActivity.jsx',
    'src/hooks/dashboard/useSupervisorOverview.js',
    'src/hooks/dashboard/usePendingPickups.js',
    'src/hooks/dashboard/useDeliveryAgents.js',
    'src/hooks/dashboard/useSupervisorAnalytics.js',
    'src/hooks/dashboard/useSupervisorNotifications.js',
    'src/pages/delivery/DeliveryDashboard.jsx',
    'src/components/delivery/TaskCard.jsx',
    'src/components/delivery/RouteMap.jsx',
    'src/components/delivery/NavigationPanel.jsx',
    'src/components/delivery/CameraProofUpload.jsx',
    'src/components/delivery/PickupDetails.jsx',
    'src/components/delivery/QRScanner.jsx',
    'src/components/delivery/TodaySummary.jsx',
    'src/hooks/dashboard/useAssignedTasks.js',
    'src/hooks/dashboard/useAgentLocation.js',
    'src/hooks/dashboard/usePickupHistory.js',
    'src/hooks/dashboard/useDeliveryNotifications.js',
]
for f in files:
    p = Path(f)
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8')
    lines = text.count('\n') + 1
    imports = re.findall(r'^import\s+(.+?)\s+from\s+[\'\"][^\'\"]+[\'\"]', text, flags=re.M)
    exports = []
    for m in re.finditer(r'export\s+(default\s+)?(const|function|class)\s+([A-Za-z0-9_]+)', text):
        exports.append(m.group(3))
    if not exports and 'export default' in text:
        exports.append('default')
    print(f'FILE:{f}')
    print(f'LINES:{lines}')
    print('IMPORTS:' + ('; '.join(imports) if imports else 'none'))
    print('EXPORTS:' + ('; '.join(exports) if exports else 'none'))
    print('---')
