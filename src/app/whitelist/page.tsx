import { getWhitelistCandidates } from "./actions";
import { WhitelistClient } from "./WhitelistClient";

export default async function WhitelistPage() {
  const { data, error } = await getWhitelistCandidates();

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-red-400 text-sm">Failed to load: {error}</p>
      </div>
    );
  }

  return <WhitelistClient initial={data ?? []} />;
}
