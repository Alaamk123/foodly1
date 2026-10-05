
export default function CookingVideoSection() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="section-title">
          See what cooking with Foodly feels like
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-primary-500">
          A quick look at easy, everyday home cooking — the kind of meals
          Foodly helps you plan.
        </p>

        <div className="relative mx-auto mt-10 aspect-video max-w-3xl overflow-hidden rounded-xl2 bg-primary-900 shadow-card-hover">
          <video
            className="h-full w-full object-cover"
            src="/videos/my-video.mp4"
            controls
            preload="metadata"
          >
            Your browser doesn't support embedded video.
          </video>
        </div>
      </div>
    </section>
  );
}

