import { selectIsCommunityEnabled, useAppSelector } from "@mezon/store";

const EnableComunity = ({ onEnable, clanId }: { onEnable: () => void; clanId?: string }) => {
  const isEnabled = useAppSelector(state => clanId ? selectIsCommunityEnabled(state, clanId) : false);

  if (isEnabled) {
    return null;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-[#5865F2] via-[#4752C4] to-[#3C45A5] rounded-2xl p-8 overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-24 translate-y-24"></div>
      <div className="absolute top-1/2 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-12"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg">
          <img
            src={"assets/images/community.png"}
            alt="Mezon Community"
            className="max-w-[350px] w-full h-auto rounded-lg shadow-md"
          />
        </div>

        <h2 className="text-4xl font-bold text-white mb-2 text-center leading-tight">Enable Community?</h2>

        <div className="w-16 h-1 bg-white/30 rounded-full mb-6"></div>

        <p className="text-white/90 text-lg mb-8 text-center max-w-2xl leading-relaxed px-4">
          Transform your community into a fully-featured Comunity experience.
          <span className="block mt-2 text-white/80 text-base">
            Access powerful administrative tools to moderate and grow your Clan effectively.
          </span>
        </p>

        <button
          onClick={onEnable}
          className="group relative px-10 py-4 bg-white text-[#5865F2] font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-out hover:bg-gray-50 active:scale-95"
        >
          <span className="relative z-10">Enable Comunity</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
        </button>

        <p className="text-white/60 text-sm mt-6 text-center">This action will unlock advanced community features</p>
      </div>
    </div>
  )
}

export default EnableComunity
