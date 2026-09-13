import Card from "@/components/shared/Card";

export type RiskArea = {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
};

type RiskAreasCardProps = {
  areas: RiskArea[];
  onSelectArea: (area: RiskArea) => void;
};

export default function RiskAreasCard({
  areas,
  onSelectArea,
}: RiskAreasCardProps) {
  return (
    <Card className="w-full">
      <p className="text-sm text-gray-400">
        Risk Areas around Home
      </p>

      <p className="mb-5 text-sm text-gray-400">
        {areas.length} {areas.length === 1 ? "place" : "places"}
      </p>

      {areas.length > 0 ? (
        <ul className="space-y-2">
          {areas.map((area) => (
            <li key={area.id}>
              <button
                type="button"
                onClick={() => onSelectArea(area)}
                className="w-full rounded-lg px-2 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-purple-50"
              >
                {area.address}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">
          No risk areas reported
        </p>
      )}
    </Card>
  );
}