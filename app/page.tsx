// import "../components/ExploreBtn";
// import ExploreBtn from "@/components/ExploreBtn";
// import EventCard from "@/components/EventCard";
// import { IEvent } from "@/database/event.model";
// import { cacheLife } from "next/cache";
// // import { events } from "@/lib/constants";

// const Page = async () => {
//   "use cache";
//   cacheLife("hours");
//   const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
//   const response = await fetch(`${BASE_URL}/api/events`);
//   const { events } = await response.json();
//   return (
//     <section>
//       <h1 className="text-center">
//         The Hub for Every Dev <br /> Event You Can&apos;t Miss
//       </h1>
//       <p className="text-center mt-5">
//         Hackathons, Meetups, and Conferences. All in One Place
//       </p>
//       <ExploreBtn />
//       <div className="mt-20 space-y-7">
//         <h3>Featured Events</h3>
//         <ol className="events">
//           {events &&
//             events.length > 0 &&
//             events.map((event: IEvent) => (
//               <li key={event.title}>
//                 <EventCard {...event} />
//               </li>
//             ))}
//         </ol>
//       </div>
//     </section>
//   );
// };

// export default Page;

import "../components/ExploreBtn";
import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import connectDB from "@/lib/mongodb";
import Event, { IEvent } from "@/database/event.model";

import { cacheLife } from "next/cache";

const Page = async () => {
  "use cache";
  cacheLife("hours");

  await connectDB();
  const events = await Event.find().sort({ createdAt: -1 }).lean();

  return (
    <section>
      <h1 className="text-center">
        The Hub for Every Dev <br /> Event You Can&apos;t Miss
      </h1>

      <p className="text-center mt-5">
        Hackathons, Meetups, and Conferences. All in One Place
      </p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ol className="events">
          {events.map((event: IEvent) => (
            <li key={event._id.toString()}>
              <EventCard {...event} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Page;
