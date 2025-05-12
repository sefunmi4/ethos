const Timeline = ({ entries }) => (
    <ul className="space-y-3">
        {entries.map((entry, idx) => (
        <li key={idx} className="p-4 border rounded shadow-sm bg-white">
            <h4 className="font-bold">{entry.title}</h4>
            <p className="text-sm text-gray-500">{new Date(entry.datetime).toLocaleString()}</p>
            <ul className="mt-2 text-sm text-gray-700">
            {entry.tags?.map((t, i) => (
                <li key={i}>• {typeof t === 'string' ? t : JSON.stringify(t)}</li>
            ))}
            </ul>
        </li>
        ))}
    </ul>
);
  
export default Timeline;