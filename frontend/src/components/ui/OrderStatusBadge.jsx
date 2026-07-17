const STATUS_STYLES = {
  PLACED:           'bg-blue-100 text-blue-700',
  CONFIRMED:        'bg-indigo-100 text-indigo-700',
  REJECTED:         'bg-red-100 text-red-700',
  PREPARING:        'bg-yellow-100 text-yellow-700',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-700',
  PICKED_UP:        'bg-orange-100 text-orange-700',
  DELIVERED:        'bg-green-100 text-green-700',
  CANCELLED:        'bg-gray-100 text-gray-600',
}

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}
