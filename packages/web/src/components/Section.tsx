import { Component, createSignal, type JSX, Show } from 'solid-js';
import { ChevronDown } from 'lucide-solid';

interface SectionProps {
  title: string;
  children: JSX.Element;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const Section: Component<SectionProps> = props => {
  const [collapsed, setCollapsed] = createSignal(props.defaultCollapsed || false);

  return (
    <div class={`section ${collapsed() ? 'collapsed' : ''}`}>
      <Show when={props.collapsible}>
        <button class="section-header" onClick={() => setCollapsed(!collapsed())}>
          <span class="section-title">{props.title}</span>
          <ChevronDown size={16} class="section-toggle" />
        </button>
      </Show>
      <Show when={!props.collapsible || !collapsed()}>
        <div class="section-content">{props.children}</div>
      </Show>
    </div>
  );
};

export default Section;
