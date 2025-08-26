interface DashboardProps {
  totalUsers: number
  totalConnectors: number
}

export default function Dashboard({ totalUsers, totalConnectors }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Yazaki Connector Manager</h2>
        <p className="text-gray-600">Manage your connectors and users efficiently from this dashboard.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{totalUsers}</h3>
              <p className="text-gray-600">Total Users</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <span className="text-2xl">🔌</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{totalConnectors}</h3>
              <p className="text-gray-600">Total Connectors</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
