export default function PageHeader({ icon, title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
      <div>
        <h1 className="text-3xl font-extrabold dark:text-white flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h1>
        {subtitle && <p className="text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
